import React, { useEffect, useState, useContext, useCallback } from 'react';
// import axios from 'axios';
import {
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    LineChart,
    Line,
    XAxis,
    YAxis,    
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import './FearAndGreedDashboard.css';
import Spinner from './Spinner';
import TextBaloon from './TextBaloon'; 
import { CsrfTokenContext } from '../CsrfTokenContext';
import { isTokenExpired, handleLogin } from '../pages/utils/AuthenticationHelper';
    
const FearAndGreedDashboard = ({ diameter = 400, coverPosition = -30, showDetails = false }) => {
    const [currentValue, setCurrentValue] = useState(0);
    const [data, setData] = useState([]);
    const [spin, setSpin] = useState(false);    
    const gradientId = `colorGradient-${diameter}`;
    const tickInterval = Math.floor(data.length / 6);
    const csrfToken = useContext(CsrfTokenContext);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    const refreshTokenIfNeeded = useCallback(async () => {
        if (isTokenExpired()) {        
          await handleLogin();
        }    
      },[]);

    useEffect(() => {
        const fetchFearAndGreedIndex = async () => {
            try {
                await refreshTokenIfNeeded();
                setSpin(true);
                const token = localStorage.getItem('token');
          
                             
                const response = await fetch(`${backendUrl}/api/fearAndGreed`, {
                    method: 'GET',                    
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    }
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
        
                const data = await response.json();                      
                
                const indexData = data.map(item => ({
                    date: item.timestamp * 1000, // Convert to milliseconds
                    value: parseInt(item.value, 10)
                }));
        
                indexData.sort((a, b) => a.date - b.date);
        
                setData(indexData);
                
                // Ensure to get the most recent value
                const latestData = indexData[indexData.length - 1];

                setCurrentValue(latestData ? latestData.value : null);
                setSpin(false);
            } catch (error) {
                console.error('Error fetching the Fear & Greed Index data:', error);
                setSpin(false);
            }
        };

        fetchFearAndGreedIndex();
    }, [csrfToken, refreshTokenIfNeeded, backendUrl]);

    const clampValue = Math.max(0, Math.min(currentValue, 100)); 

    let fearLevel = '';
    let fearDescription = '';
    let balloonColor = '';
    let textColor = '';

    // Calculate fear level and description
    if (clampValue >= 0 && clampValue <= 20) {
        fearLevel = 'Extreme Fear';
        fearDescription = {message1};
        balloonColor = '#ff3e15';
        textColor = '#dadada';
    } else if (clampValue >= 21 && clampValue <= 40) {
        fearLevel = 'Fear';
        fearDescription = {message2};
        ballonColor = '#ff5f1d';
        textColor = '#dadada';
    } else if (clampValue >= 41 && clampValue <= 60) {
        fearLevel = 'Neutral';
        fearDescription = {message3};
        balloonColor = '#ffcb16';
        textColor = '#003c5a';
    } else if (clampValue >= 61 && clampValue <= 80) {
        fearLevel = 'Greed';
        fearDescription = {message4};
        balloonColor = '#96c708';
        textColor = '#003c5a';
    } else if (clampValue >= 81 && clampValue <= 100) {
        fearLevel = 'Extreme Greed';
        fearDescription = {message5};
        balloonColor = '#4aa006';
        textColor = '#dadada';
    }

    const formatDate = (date) => {
        const result = new Date(date);
        const year = result.getFullYear();
        const month = String(result.getMonth() + 1).padStart(2, '0'); 
        const day = String(result.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Calculate the position of the arrow
    const calculateArrowPosition = (value, radius) => {
        const angle = (180 - (value / 100) * 180) * (Math.PI / 180); // Convert to radians
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        return { x, y, angle: 180 - (value / 100) * 180 }; // Calculate angle for rotation
    };

    const CustomTooltip = ({ active = false, payload = [] }) => {
        if (active && payload && payload.length) {
          const data = payload[0].payload;
          
          let tooltipText = '';
          let tooltipColor = '';
          if (data.value >= 0 && data.value <= 20) {
            tooltipText = 'Extreme Fear';
            tooltipColor = '#ff3e15';
          } else if (data.value >= 21 && data.value <= 40) {
            tooltipText = 'Fear';
            tooltipColor = '#ff5f1d';
          } else if (data.value >= 41 && data.value <= 60) {
            tooltipText = 'Neutral';
            tooltipColor = '#ffcb16';
          } else if (data.value >= 61 && data.value <= 80) {
            tooltipText = 'Greed';
            tooltipColor = '#96c708';
          } else if (data.value >= 81 && data.value <= 100) {
            tooltipText = 'Extreme Greed';
            tooltipColor = '#4aa006';
          }
          
          return (
            <div className="custom-tooltip">
              <div style={{ color: tooltipColor, textShadow:'-1px -1px 0 #171b26, 1px -1px 0 #171b26, -1px 1px 0 #171b26, 1px 1px 0 #171b26' }}>{tooltipText}</div>
              <div>{formatDate(new Date(data.date).toLocaleDateString())}</div>
              <div>Index : {data.value}</div>
            </div>
          );
        }
        
        return null;
      };

    const arrowPosition = calculateArrowPosition(clampValue, diameter / 2 - 50); // Adjust radius as needed

    return (
        <>
        {spin && (
            <Spinner title="" color="#7572c7" />
        )}
            {data.length > 0 && (
                <div className="dashboard">            
                    <div className="gauge-container">
                        <RadialBarChart
                            width={diameter}
                            height={diameter / 2}
                            cx={diameter / 2}
                            cy={diameter / 2}
                            innerRadius={diameter / 2 - 50}
                            outerRadius={diameter / 2 - 10}
                            barSize={20}
                            startAngle={180}
                            endAngle={0}
                            data={[{ name: 'Index', value: 100 }]}
                        >
                            <defs>                                                                
                                <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2='100%' y2="0%">                                
                                    <stop offset="0%" stopColor="red" />
                                    <stop offset="50%" stopColor="yellow" />
                                    <stop offset="100%" stopColor="green" />
                                </linearGradient>
                            </defs>
                            <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                angleAxisId={0}
                                tick={false}
                            />
                            <RadialBar
                                minAngle={15}
                                clockWise
                                dataKey="value"
                                fill={`url(#${gradientId})`}
                            />
                            <text
                                x={diameter / 2}
                                y={diameter / 2 + coverPosition + 20}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="progress-label"
                                style={{ fontSize: showDetails ? '35px' : '30px', fontWeight: 'bold', fill: '#b3b3b3' }}
                            >                              
                                {fearLevel}
                            </text>
                            <svg
                                x={diameter / 2}
                                y={diameter / 2}
                                width={diameter}
                                height={diameter / 2}
                                viewBox={`0 0 ${diameter} ${diameter / 2}`}
                                style={{ overflow: 'visible', position: 'absolute', transform: `translate(-50%, -50%)` }}
                            >
                                <circle
                                    cx={arrowPosition.x}
                                    cy={-arrowPosition.y}
                                    r="20"
                                    fill="white"
                                    transform={`rotate(${arrowPosition.angle}, ${arrowPosition.x}, ${-arrowPosition.y})`}
                                />
                                <text
                                    x={arrowPosition.x}
                                    y={-arrowPosition.y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="black"
                                    fontSize="30px"
                                    fontWeight="bold"
                                    
                                >
                                    {clampValue}
                                </text>
                            </svg>                    
                        </RadialBarChart>                
                    </div>
                    {showDetails && (
                    <>                       
                        <br/><br/>
                        <TextBaloon number="" arrowPosition ={'top'} textColor={textColor} text={<>{fearDescription}</>} color={balloonColor} />                    
                        <br/><br/>
                        <h1>Last 6 Months</h1>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={data}
                                margin={{
                                    top: 5, right: 30, left: 20, bottom: 5,
                                }}
                            >                            
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(date) => formatDate(new Date(date).toLocaleDateString())} 
                                    tick={{ angle: 0, textAnchor: 'end', dx: -10, dy: 5 }}
                                    interval={tickInterval}                                    
                                />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />                                
                                <Line
                                    type="linear"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={false}
                                    name='Index' />
                            </LineChart>
                        </ResponsiveContainer>                        
                    </>
                    )}
                </div>
            )}
        </>
    );    
};

export default FearAndGreedDashboard;