import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './FollowStrategyManager.css';
import { CsrfTokenContext } from '../CsrfTokenContext'; 
import Switch from 'react-switch';
import DecisionModal from './DecisionModal';
import { setOriginalStrategies } from '../pages/slices/mySpaceSlicer';
import { isTokenExpired, handleLogin } from '../pages/utils/AuthenticationHelper';

const FollowStrategyManager = () => {
  const [status, setStatus] = useState(null);
  const [strategies, setStrategies] = useState([]);    
  const [changedStrategies, setChangedStrategies] = useState([]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);  
  const [canDelete, setCanDelete] = useState(false);  
  const [selectedFollowId, setSelectedFollowId] = useState(0);  
  const [modalShow, setModalShow] = useState(false);
  const [actionStatus, setActionStatus] = useState(false);        
  const [spin, setSpin] = useState(false);        
  const [selectedStrategy, setSelectedStrategy] = useState(0);        

  const { walletId } = useSelector(state => state.globalData);
  const { symbolIcons } = useSelector(state => state.streamCryptoInfo);
  const { originalStrategies } = useSelector(state => state.mySpace);

  const handleShow = () => setModalShow(true);
  const handleClose = () => {
    setModalShow(false);
    setSelectedFollowId(0);
    setCanDelete(false);
  };

  const csrfToken = useContext(CsrfTokenContext); 
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const dispatch = useDispatch();
  
  const refreshTokenIfNeeded = useCallback(async () => {
    if (isTokenExpired()) {        
      await handleLogin();
    }    
  },[]);

  const handleCheckChange = (index) => {
    let newChangedStrategies = [...changedStrategies];

    const updatedStrategies = strategies.map((strategy, i) => {
      if (i === index) {
        const updatedStrategy = { ...strategy, following: !strategy.following };

        // Check if the updated strategy differs from the original
        if (updatedStrategy.following !== originalStrategies[i].following) {
          // Add or update the changed strategy in the list
          if (!newChangedStrategies.some(item => item.follow_id === updatedStrategy.follow_id)) {
            newChangedStrategies.push(updatedStrategy);
          }
        } else {
          // Remove the strategy from the list if it matches the original
          newChangedStrategies = newChangedStrategies.filter(item => item.follow_id !== updatedStrategy.follow_id);
        }

        return updatedStrategy;
      }
      return strategy;
    });

    setStrategies(updatedStrategies);
    setChangedStrategies(newChangedStrategies);
    setIsButtonDisabled(newChangedStrategies.length === 0);
    setStatus('');
};
  
  const updFollowStrategy = async (strategy_set) => {
    try {       
      
        const filteredStrategySet = strategy_set.map(({ follow_id, following }) => ({
          follow_id,
          following
        }));
        
        await refreshTokenIfNeeded();
        
        const token = localStorage.getItem('token');          
      
        const response = await fetch(`${backendUrl}/api/upd_follow_strategy`, {
            method: 'POST',
            // credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken, // Ensure the CSRF token is correctly passed
            },
            body: JSON.stringify({walletId : walletId, strategy_set : filteredStrategySet})
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }
        setStatus('Saved!');

        getAllFollowStrategies();       
  
    } catch (err) {
      console.error('Error fetching data:', err);     
    }
};

const del_strategy = async (wallet, followId) => {
  try {
    await refreshTokenIfNeeded();
      setActionStatus(false);
      setSpin(true);
      const token = localStorage.getItem('token');
          

      const response = await fetch(`${backendUrl}/api/del_follow_strategy`, {
          method: 'DELETE',
          // credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken // Ensure csrfToken is correctly set
          },
          body: JSON.stringify({
              wallet: wallet,
              follow_id: followId
          })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
      }

      setActionStatus(true);
      setSpin(false);
      setCanDelete(false);

      setTimeout(() => {
          setModalShow(false);
          setActionStatus(false);
          setStatus('Strategy follow has been deleted!');
          getAllFollowStrategies();
      }, 1000);

  } catch (err) {
      console.error('Error deleting strategy:', err);
      setModalShow(false);
      setActionStatus(false);
      setSpin(false);
  }
};

const saveChanges = () => {  
  updFollowStrategy(changedStrategies);
  
};

const deleteStrategy = () =>{
  del_strategy(walletId, selectedFollowId);
} 

const handleSelectedRow = (index, strategy) => {

  setSelectedFollowId(index);
  setSelectedStrategy(strategy);
  setCanDelete(true);
  setStatus('');

};

const getAllFollowStrategies = useCallback(async () => {
  try {
    await refreshTokenIfNeeded();
    const token = localStorage.getItem('token');
          
    const response = await fetch(`${backendUrl}/api/getAllFollowStrategies?walletId=${walletId}`, {
      method: 'GET',      
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error);
    }
    const result = await response.json();
   
    setStrategies(result);
    dispatch(setOriginalStrategies(result));

  } catch (err) {
    console.error('Error fetching data:', err);
    setStatus('An error occurred: ' + err);
  }
}, [csrfToken, walletId, dispatch, refreshTokenIfNeeded, backendUrl]);

  
  useEffect(() => { 
    
    getAllFollowStrategies();

  }, [getAllFollowStrategies]);

  const cellStyle = {
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  return (
    <>      
        <div className="contentWrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', width:'100%' }}>
          <div style={{fontSize:'25px', margin:'20px'}}>Your Strategy Watchlist</div>
          <div style={{ height: '100px', paddingTop: '15px', flex: '1' }}>
            <div className="tableContainer">
              <table className="table">
                <thead>
                  <tr style={{ backgroundColor: '#8cb753', color: '#3a4b00' }}>
                    <th></th>
                    <th style={{ textAlign: 'left' }}>Symbol</th>
                    <th>Interval</th>
                    <th>Ema 1</th>
                    <th>Ema 2</th>
                    <th>Strategy</th>
                    <th>Origin</th>
                    <th style={{ zIndex: '1' }}>Following</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.length > 0 && strategies.map((strategy, index) => (
                    <tr key={index} onClick={() => handleSelectedRow(strategy.follow_id, strategy.strategy)} className={strategy.follow_id === selectedFollowId ? 'selectedRow' : ''}>
                      <td>
                        <img src={symbolIcons[strategy.symbol.replace('-', '') + 'T']} alt="" style={{ width: '30px', borderRadius: '50%' }} />
                      </td>
                      <td style={{ ...cellStyle, width: '20%', textAlign: 'left' }}>
                        {strategy.symbol}
                      </td>
                      <td style={{ ...cellStyle, width: '10%' }}>{strategy.interval}</td>
                      <td style={{ ...cellStyle, width: '10%' }}>{strategy.ema1}</td>
                      <td style={{ ...cellStyle, width: '10%' }}>{strategy.ema2}</td>
                      <td style={{ ...cellStyle, width: '10%' }}>{strategy.strategy}</td>
                      <td style={{ ...cellStyle, width: '20%', color: strategy.is_default_strategy ? '#72920f' : '#2962ff' }}>{strategy.is_default_strategy ? 'System' : 'Custom'}</td>
                      <td style={{ ...cellStyle, width: '20%' }}>
                        <Switch
                          onChange={() => handleCheckChange(index)}
                          checked={strategy.following}
                          offColor="#888"
                          onColor="#00c100"
                          offHandleColor="#fff"
                          onHandleColor="#fff"
                        />
                      </td>
                    </tr>
                  ))}
                  {strategies.length === 0 &&
                    <tr>
                      <td colSpan={8} style={{ width: '10%', fontSize: '15pt' }}>No data yet, your followed strategies will be listed here.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div className="button_wrapper_follow" style={{ marginTop: 'auto' }}>
            <div
              className={`button_container_fw button_save ${isButtonDisabled ? 'disable_button_follow' : ''}`}
              onClick={!isButtonDisabled ? saveChanges : undefined} >
              <i className="bi bi-save-fill" style={{ marginRight: '5px' }}></i>
              Save Changes
            </div>
            <div
              className={`button_container_fw button_delete ${!canDelete ? 'disable_button_follow' : ''}`}
              onClick={canDelete ? handleShow : undefined} >
              <i className="bi bi-trash-fill" style={{ marginRight: '5px' }}></i>
              Remove Follow Strategy
            </div>  
          </div>
          {status && <p>{status}</p>}
        </div>     
      <DecisionModal
        show={modalShow}
        onHide={handleClose}
        onConfirm={deleteStrategy}
        title={`You will no longer follow the Strategy ${selectedStrategy}`}
        spin={spin}
        actionConcluded={actionStatus}
      />
    </>
  );
};

export default FollowStrategyManager;