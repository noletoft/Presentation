from sqlalchemy.orm import relationship, Session, declarative_base, aliased
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, Text, CHAR, Boolean, create_engine, func, and_, select, sql, text, desc, asc
from sqlalchemy.dialects.postgresql import insert
from Crypto_Infos import get_coin_info, get_top_cryptocurrencies, get_yesterday_symbols_values, get_crypto_description
from urllib.parse import quote_plus
import Config as cfg
from Cryptor import Criptor
from datetime import datetime, timedelta, timezone, date
import asyncio
import hashlib
import logging
from psycopg2 import sql as psql


crp = Criptor()
Base = declarative_base()    
password_encoded = quote_plus(crp.DecryptIt(cfg.PWD))
    
db_host = 'localhost'    
str_engine = f"postgresql://postgres:{password_encoded}@{db_host}/Cryptus"
    
engine = create_engine(str_engine)

class DecisionMethod(Base):
    __tablename__ = 'Decision_Method'   

    decision_id = Column(Integer, primary_key=True)
    DMethod = Column(Text)


class Properties(Base):
    __tablename__ = 'Properties'   

    prop_id = Column(Integer, primary_key=True)
    ticker = Column(Text)
    interval = Column(Text)
    periode = Column(Integer)
    EMA_cross_1 = Column(Integer)
    EMA_cross_2 = Column(Integer)
    cross_strategy = Column(Text)


class Symbols(Base):
    __tablename__ = 'Symbols'
    # __tablename__ = Base.metadata.tables["Symbols"]

    symbol_id = Column(Integer, primary_key=True)
    symbol_name = Column(Text)
    symbol_full_name = Column(Text)
    update_date = Column(DateTime, default=timezone.utc, nullable=False)
    symbol_icon = Column(Text)
    ranking = Column(Integer)
    
class Symbols_D1(Base):
    __tablename__ = 'Symbols_D1'    

    symbol_id = Column(Integer, primary_key=True)
    symbol_name = Column(Text)
    update_date = Column(DateTime, default=timezone.utc, nullable=False)
    d_1_mkt_value = Column(Float)    
    
class Symbol_Description(Base):
    __tablename__ = 'Symbol_Description'    

    sdesc_id = Column(Integer, primary_key=True)
    symbol = Column(Text)
    description = Column(Text)
    update_date = Column(DateTime, default=timezone.utc, nullable=False)
        
   

class M4hMarketData(Base):
    __tablename__ = 'M4h_market_data'

    mkt_id = Column(Integer, primary_key=True)
    process_id = Column(Text)
    symbol_id = Column(ForeignKey('Symbols.symbol_id'), nullable=False)
    mkt_date_time = Column(Text)
    mkt_close = Column(Float)
    mkt_open = Column(Float)
    mkt_high = Column(Float)
    mkt_low = Column(Float)
    process_date_time = Column(Text)

    symbol = relationship('Symbols')


class Operation(Base):
    __tablename__ = 'Operations'

    opr_id = Column(Integer, primary_key=True)
    process_id = Column(Text)
    symbol_id = Column(ForeignKey('Symbols.symbol_id'), nullable=False)
    prop_id = Column(ForeignKey('Properties.prop_id'), nullable=False)
    is_active = Column(Integer, nullable=False)
    process_date_time = Column(Text)

    symbol = relationship('Symbols')
    propertie = relationship('Properties') 


class OperationDecision(Base):
    __tablename__ = 'Operation_Decision' 

    od_id = Column(Integer, primary_key=True)
    mkt_id = Column(ForeignKey('M4h_market_data.mkt_id'), nullable=False)
    process_id = Column(Text)    
    decision_id = Column(ForeignKey('Decision_Method.decision_id'), nullable=False)
    Buy_Sell = Column(Text)
    Opt_Value = Column(Float)
    USD_Gain = Column(Float)
    process_date_time = Column(Text)

    decision = relationship('DecisionMethod')  
     
class Simulation(Base):
    __tablename__ = 'Simulation'        
    sml_id = Column(Integer, primary_key=True)
    symbol = Column(Text)
    process_id = Column(Text)
    interval  = Column(Text)
    d_start  = Column(Text)
    d_end  = Column(Text)
    ema_1  = Column(Integer, nullable=False)
    ema_2  = Column(Integer, nullable=False)
    good_operation = Column(Integer, nullable=False)
    bad_operation = Column(Integer, nullable=False)
    final_percentage  = Column(Float)
    start_entry  = Column(Float)
    final_profit  = Column(Float)
    strategy = Column(Integer)
    
class Strategy_Rules(Base):
    __tablename__ = 'Strategy_Rules'
    str_rule_id = Column(Integer, primary_key=True)
    strg_id = Column(Integer, nullable=False)
    operation_order = Column(Integer, nullable=False)
    operand_1 = Column(Text, nullable=False)
    operator = Column(Text, nullable=False)
    operand_2  = Column(Text, nullable=False)
    optional_operator  = Column(Text, nullable=True)
    strg_buysell  = Column(Text, nullable=False)
    UpdateDate = Column(DateTime, default=timezone.utc, nullable=False)
    wallet_id  = Column(Integer, nullable=False)
    
class Wallet(Base):
    __tablename__ = 'Wallet'
    wallet_id = Column(Integer, primary_key=True)    
    identifier = Column(Text, nullable=False)
    wallet = Column(Text, nullable=False)
    update_date = Column(DateTime, default=timezone.utc, nullable=False)    
    email = Column(Text, nullable=True)
    
class PaymentHash(Base):
    __tablename__ = 'PaymentHash'
    ph_id = Column(Integer, primary_key=True)    
    wallet_id = Column(ForeignKey('Wallet.wallet_id'), nullable=False)
    paymentHash = Column(Text, nullable=False)
    paymentType = Column(CHAR, nullable=False)
    paymentDate = Column(DateTime, default=timezone.utc, nullable=False)
    
    wallet = relationship('Wallet')
    
class FollowStrategy(Base):
    __tablename__ = 'FollowStrategy'
    follow_id = Column(Integer, primary_key=True)    
    wallet_id = Column(ForeignKey('Wallet.wallet_id'), nullable=False)    
    symbol = Column(Text, nullable=False)
    interval = Column(Text, nullable=False)
    ema1  = Column(Integer, nullable=False)
    ema2  = Column(Integer, nullable=False)
    strategy  = Column(Integer, nullable=False)    
    is_default_strategy  = Column(Boolean, nullable=False)  
    following  = Column(Boolean, nullable=False)  
    update_date = Column(DateTime, default=timezone.utc, nullable=False)
    mkt_date_buy = Column(DateTime, nullable=True)
    mkt_date_sell = Column(DateTime, nullable=True)
    
    wallet = relationship('Wallet')
    
    

# This can be any of above classes
def add_items(items):    
    with Session(engine) as session:        
        try:
            session.add(items)
            session.commit()
        except:
            session.rollback()
            raise
        
def get_symbol_by_name(name):
    with Session(engine) as session:
        return session.query(Symbols).filter(Symbols.symbol_name==name).first()
    
def get_properties_by_ticker(ticker):
    with Session(engine) as session:
        return session.query(Properties).filter(Properties.ticker==ticker)
    
def get_all_operations():
    with Session(engine) as session:
        return session.query(Operation).all()
    
def get_symbol_by_id(id):
    with Session(engine) as session:        
        result = session.query(Symbols).filter(Symbols.symbol_id == id).first()
        if result:
            results_dict = [{column.name: getattr(result, column.name) for column in result.__table__.columns}]
            return results_dict
        else:
            return None  
    
def get_active_symbols():
    with Session(engine) as session:
        op_actives = session.query(Operation.symbol_id).filter(Operation.is_active==True).all()
        active_symbol_ids = [symbol_id for symbol_id, in op_actives]  # Extract symbol IDs from rows
        return session.query(Symbols).filter(Symbols.symbol_id.in_(active_symbol_ids)).all()
        
    
def get_all_symbols(topRank=0):
    
    upd_symbols_weekly()
    
    query = f"select distinct s.symbol_id, s.symbol_name, s.symbol_icon, s.ranking from \"Symbols\" s ORDER BY s.ranking" if topRank == 0 else f'SELECT distinct s.symbol_id, s.symbol_name, s.symbol_icon, s.ranking FROM \"Symbols\" s ORDER BY s.ranking LIMIT {topRank}'
            
    with Session(engine) as session:
        result = session.execute(text(query)).fetchall()       
        results_dict = [{"symbol_id": row.symbol_id, "symbol_name": row.symbol_name, "symbol_icon" : row.symbol_icon, 'ranking': row.ranking} for row in result]
            
        return results_dict

    # symbols_d1 are related to initial default value for stream mkt value
async def get_all_symbols_d1():
    
    # daily update
    await upd_symbols_daily()
                
    with Session(engine) as session:        
        result = session.query(Symbols_D1).all()
        results_dict = [{"symbol": row.symbol_name.replace('-USD',''), "price": row.d_1_mkt_value} for row in result]
            
        return results_dict
    
def set_symbol_operation_state(symbol_id, activate=True):
    with Session(engine) as session:        
        try:            
            operation = session.query(Operation).filter(Operation.symbol_id==symbol_id).first()
            operation.is_active = activate            
            session.commit()
        except:
            session.rollback
            raise

def set_properties(property):
    ticker = property.ticker
    new_property = insert(Properties).values(
        ticker = property.ticker,
        interval = property.interval,
        periode = property.periode,
        EMA_cross_1 = property.EMA_cross_1,
        EMA_cross_2 = property.EMA_cross_2,
        cross_strategy = property.cross_strategy        
    ).on_conflict_do_nothing(
        index_elements=['ticker', 'interval', 'periode','EMA_cross_1', 'EMA_cross_2', 'cross_strategy']
    )
    
    with Session(engine) as session:        
        try:
            session.execute(new_property)
            session.commit()            
        except:
            session.rollback
            raise
    
    add_symbol(ticker)
        
def set_operation(operation):        
    new_operation = insert(Operation).values(        
        process_id = operation.process_id,
        symbol_id = operation.symbol_id,
        prop_id = operation.prop_id,
        is_active = operation.is_active,
        process_date_time = operation.process_date_time          
    ).on_conflict_do_nothing(
        index_elements=['prop_id']
    )
    
    with Session(engine) as session:        
        try:
            session.execute(new_operation)
            session.commit()
        except:
            session.rollback
            raise

def set_simulation(simulation):        
    new_operation = insert(Simulation).values(        
        symbol = simulation.symbol,
        process_id = simulation.process_id,
        interval  = simulation.interval,
        d_start  = simulation.d_start,
        d_end  = simulation.d_end,
        ema_1  = simulation.ema_1,
        ema_2  = simulation.ema_2,
        good_operation = simulation.good_operation,
        bad_operation = simulation.bad_operation,
        final_percentage  = simulation.final_percentage,
        start_entry  = simulation.start_entry,
        final_profit  = simulation.final_profit,        
        strategy  = simulation.strategy        
    ).on_conflict_do_nothing(
        index_elements=['symbol', 'interval', 'd_start', 'd_end', 'ema_1', 'ema_2', 'strategy']
                                       
    )
    
    with Session(engine) as session:        
        try:
            session.execute(new_operation)
            session.commit()
        except:
            session.rollback
            raise

def get_simulations_by_ticker(ticker, interval):
    query = text(f"""
            SELECT s.symbol, s.interval , s.ema_1, s.ema_2, s.good_operation, 
            s.bad_operation, s.final_percentage, s.final_profit, 
            s.strategy, s.d_start, s.d_end 
            FROM \"Simulation\" s 
            where s.symbol = '{ticker}'
            and s."interval" = '{interval}'
            order by final_percentage desc
        """)
    with Session(engine) as session:        
        return session.execute(query)
    
def get_all_simulations():
    query = text(f"""
            SELECT s.symbol, s.interval , s.ema_1, s.ema_2, s.good_operation, 
            s.bad_operation, s.final_percentage,
            s.strategy, s.d_start, s.d_end 
            FROM \"Simulation\" s             
            where s.d_start = '2022-05-01'
            order by final_percentage desc
        """)
    with Session(engine) as session:        
        return session.execute(query)
                
def get_latest_close_date_by_symbol(symbol_id):
    with Session(engine) as session:
        return session.query(func.max(M4hMarketData.mkt_date_time)).filter(M4hMarketData.symbol_id==symbol_id).scalar()
    
def get_ticker_id_by_name(ticker):
    with Session(engine) as session:  
            return session.execute(text(f"select s.symbol_id from \"Symbols\" s where s.symbol_name = '{ticker}'")).first()
    
def get_mkt_values_by_symbol_id(symbol_id, get_all, last_data_poits=250):
    with Session(engine) as session:
        if(get_all):
            return session.query(M4hMarketData.mkt_date_time,
                                M4hMarketData.mkt_close).where(M4hMarketData.symbol_id==symbol_id).order_by(M4hMarketData.mkt_date_time).all()
        else:
            return session.query(M4hMarketData.mkt_date_time,
                                M4hMarketData.mkt_close)\
                .where(M4hMarketData.symbol_id==symbol_id)\
                .order_by(M4hMarketData.mkt_date_time.desc())\
                            .limit(last_data_poits).all()
                            
def get_mkt_values_by_ticker_date_range(ticker, interval, d_start=None, d_end=None):
    
    try:   
   
        if d_end==None:
            d_end = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        else:
            date = datetime.strptime(d_end, "%Y-%m-%d") + timedelta(days=1)
            d_end = date.strftime('%Y-%m-%d')
        
        ticker_id = get_ticker_id_by_name(ticker)
        
        if(ticker_id==None):
            raise ValueError(f"This ticker ({ticker}) do not exists.")
        else:
            ticker_id = ticker_id[0]
        
        if interval == '4h':
            
            with Session(engine) as session:
                if(d_start==None):
                    return session.query(
                        M4hMarketData.mkt_date_time,
                        M4hMarketData.mkt_close
                    ).filter(
                       M4hMarketData.symbol_id == ticker_id
                    ).order_by(M4hMarketData.mkt_date_time).all()
                else:
                    return session.query(
                        M4hMarketData.mkt_date_time,
                        M4hMarketData.mkt_close
                    ).filter(
                        and_(
                            M4hMarketData.mkt_date_time >= d_start,
                            M4hMarketData.mkt_date_time < d_end,
                            M4hMarketData.symbol_id == ticker_id
                        )
                    ).order_by(M4hMarketData.mkt_date_time)\
                    .all()
        elif interval == '1d':
            return get_mkt_daily_by_ticker_date_range(ticker_id, d_start, d_end)
        else:
            # Do nothing
            print(f"Unexpected Interval : {interval}")
    except ValueError as e:
        print(e)
    
def get_mkt_daily_by_ticker_date_range(ticker_id, d_start, d_end=None):   
       
    with Session(engine) as session:
        # Create a subquery for maximum date times grouped by day
        sub_query = None
        if(d_start==None):
            sub_query = session.query(
                func.max(M4hMarketData.mkt_date_time).label('max_datetime')
            ).filter(
                M4hMarketData.symbol_id == ticker_id
            ).group_by(func.date_trunc('day', M4hMarketData.mkt_date_time)).subquery()
        else:
            sub_query = session.query(
                func.max(M4hMarketData.mkt_date_time).label('max_datetime')
            ).filter(
                and_(
                    M4hMarketData.mkt_date_time >= d_start,
                    M4hMarketData.mkt_date_time < d_end,
                    M4hMarketData.symbol_id == ticker_id
                )
            ).group_by(func.date_trunc('day', M4hMarketData.mkt_date_time)).subquery()
            
            # Ensure the subquery is a select() construct
        sub_query = select(sub_query) if not isinstance(sub_query, sql.selectable.Select) else sub_query

        # Now, select data from M4hMarketData where mkt_date_time matches the max datetime found in the subquery
        main_query = select(
            M4hMarketData.mkt_date_time,
            M4hMarketData.mkt_close
        ).where(M4hMarketData.symbol_id == ticker_id, M4hMarketData.mkt_date_time.in_(sub_query))

        # Execute the main query and fetch all results
        results = session.execute(main_query).all()

        # Return or process your results
        return results  

# Important to garantee we have always a fresh data for this deleted row, replacing it by a updated one 
def del_last_records(symbol_id):
    with Session(engine) as session:       
       
        mkt_latest_row = session.query(M4hMarketData).where(M4hMarketData.symbol_id==symbol_id).order_by(M4hMarketData.mkt_id.desc()).first()
    
        if mkt_latest_row:
            # Delete the identified latest row
            session.delete(mkt_latest_row)
            session.commit()
            

# Add symbol if it does not exist
def add_symbol(ticker):
    if(get_symbol_by_name(ticker)==None):           
        coins = ticker.split("-")        
        symbol_info = get_coin_info(coins[0], coins[1])
        new_item = Symbols(
                symbol_name = ticker,
                symbol_full_name = symbol_info["FullName"],
                update_date = symbol_info["update_date"],
                symbol_icon = f"{symbol_info['Name']}.png",
            )
        add_items(new_item)
        
def upd_symbols_weekly():
    
    today = datetime.today()
    
    with Session(engine) as session:
        
        try:
        
            last_update_date = session.query(Symbols.update_date).first()
            
            if(last_update_date):
                difference = today - last_update_date.update_date
                
                if(difference < timedelta(days=7)):
                    return
                
            session.query(Symbols).delete()
            session.commit()
            
            symbols = get_top_cryptocurrencies()
            
            symbols_db = []
            
            r_count = 0
            
            for symbol_info in symbols:
                r_count = r_count + 1
                symbol = insert(Symbols).values(
                    symbol_name=f"{symbol_info['symbol']}-USD",
                    symbol_full_name=symbol_info['name'],
                    update_date=datetime.now(),
                    symbol_icon=symbol_info['icon_url'],
                    ranking= r_count
                ).on_conflict_do_nothing(index_elements=['symbol_name'])
                    
                session.execute(symbol)            
        
            session.commit()
        
        except:
            session.rollback()
            raise
        
async def upd_symbols_daily():   
    
    today = datetime.today()
    
    with Session(engine) as session:
        
        last_update_date = session.query(Symbols_D1.update_date).first()
        today = datetime.today().date()
        
        
        if last_update_date is not None:
            # Get the date part of last_update_date.update_date
            last_update_date_only = last_update_date.update_date.date()

            # Check if the date is today
            if last_update_date_only == today:
                return  # or perform any other operation
            
        session.query(Symbols_D1).delete()
        session.commit()
        
        all_symbols = get_all_symbols()
        symbols = [item['symbol_name'] for item in all_symbols]
        
        data = await get_yesterday_symbols_values(symbols)
                        
        for symbol_info in data:            
            symbol = insert(Symbols_D1).values(
                symbol_name=f"{symbol_info['symbol']}-USD",                
                d_1_mkt_value=symbol_info['price'],
                update_date=datetime.now()                
            ).on_conflict_do_nothing(index_elements=['symbol_name'])
                
            session.execute(symbol)            
       
        session.commit()
        
def add_mkt(mkt):
    new_mkt = insert(M4hMarketData).values(        
        process_id = mkt.process_id,
        symbol_id = mkt.symbol_id,
        mkt_date_time = mkt.mkt_date_time,
        mkt_close = mkt.mkt_close,
        mkt_open = mkt.mkt_open,
        mkt_high = mkt.mkt_high,
        mkt_low = mkt.mkt_low,
        process_date_time = mkt.process_date_time            
    ).on_conflict_do_nothing(
        index_elements=['symbol_id', 'mkt_date_time']
    )
    
    mkt_id = 0
    
    with Session(engine) as session:
        try:
            result = session.execute(new_mkt)            
            session.commit()
            if result.inserted_primary_key:
                mkt_id = result.inserted_primary_key[0]
        except:
            session.rollback
            raise
                
    return mkt_id

def del_simulations(ticker, end_date):
    with Session(engine) as session:       
        session.query(Simulation).where(Simulation.symbol==ticker, Simulation.d_end!=end_date).delete()
        session.commit()
        
def get_strategy_rules(wallet_id, buySell):
     with Session(engine) as session:
        result = session.query(Strategy_Rules).filter(and_(Strategy_Rules.wallet_id == wallet_id, Strategy_Rules.strg_buysell == buySell)).order_by(Strategy_Rules.strg_id, Strategy_Rules.operation_order).all()             
        return transform_conditions(result)
    
def get_strategy_setting_rules(wallet_id):
     with Session(engine) as session:
        result = session.query(Strategy_Rules).filter(Strategy_Rules.wallet_id == wallet_id).order_by(Strategy_Rules.strg_id, Strategy_Rules.strg_buysell, Strategy_Rules.operation_order).all()
        
        results_dict = [{"strg_id": row.strg_id, 
                         "operation_order": row.operation_order, 
                         "operand_1" : row.operand_1, 
                         'operator': row.operator,
                         'operand_2': row.operand_2,
                         'optional_operator': row.optional_operator,
                         'strg_buysell': row.strg_buysell
                         } for row in result]
        return results_dict
    
def del_strategy(wallet, strategy_id):
    with Session(engine) as session:       
        session.query(Strategy_Rules).where(Strategy_Rules.wallet_id == wallet, Strategy_Rules.strg_id==strategy_id).delete()
        session.commit()
        
def del_followed_strategy(wallet, follow_id):
    with Session(engine) as session:       
        session.query(FollowStrategy).where(FollowStrategy.wallet_id == wallet, FollowStrategy.follow_id==follow_id).delete()
        session.commit()
        
def upd_strategy(wallet, buyConditions, sellConditions, strategy_id):
    del_strategy(wallet, strategy_id)
    set_strategy_rules(wallet, 'buy', buyConditions, strategy_id)
    set_strategy_rules(wallet, 'sell', sellConditions, strategy_id)
    
def get_max_strg_id(wallet_id):
    
    strg_id = 0
    
    with Session(engine) as session:
        
        max_strg_id = session.query(func.max(Strategy_Rules.strg_id)).filter(Strategy_Rules.wallet_id == wallet_id).scalar()
        
        # Increment strg_id or set it to 1 if None
        if max_strg_id is None:
            strg_id = 1
        else:
            strg_id = max_strg_id + 1
        
    return strg_id
    
def set_strategy_rules(wallet_id, buySell, conditions, strg_id):
    
    inserts = []
    
    with Session(engine) as session:
        
        for condition in conditions:
            inserts.append(insert(Strategy_Rules).values(
                strg_id=strg_id,
                operation_order=int(condition['operation_order']),
                operand_1=condition['operand_1'],
                operator=condition['operator'],
                operand_2=condition['operand_2'],
                optional_operator=condition['optional_operator'],
                strg_buysell=buySell,
                UpdateDate=datetime.now(),  # Assuming UpdateDate should be the current timestamp
                wallet_id=wallet_id
            ))
        try:
            for stmt in inserts:
                session.execute(stmt)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
  
def transform_conditions(db_result):
    conditions_result = {}
    
    condition_strings = {}
    
    for rule in db_result:
        strg_id = rule.strg_id
        operand_1 = rule.operand_1
        operator = rule.operator
        operand_2 = rule.operand_2
        optional_operator = rule.optional_operator
        
        if '(' in operand_1:
            operand_1_str = f"(strategy['{operand_1.replace('(', '')}']"
        elif ')' in operand_1:
            operand_1_str = f"strategy['{operand_1.replace(')', '')}'])"
        else:
            operand_1_str = f"strategy['{operand_1}']"
        
        # Check if operand_2 is numeric, if not, use 'strategy[<operand_2>]'
        if operand_2.lstrip('-').replace('.', '', 1).isdigit():
            operand_2_str = operand_2
        elif '(' in operand_2:
            operand_2_str = f"(strategy['{operand_2.replace('(', '')}']"
        elif ')' in operand_2:
            operand_2_str = f"strategy['{operand_2.replace(')', '')}'])"
        else:
            operand_2_str = f"strategy['{operand_2}']"
        
        # Construct the condition string
        condition = f"{operand_1_str} {operator} {operand_2_str}"
        
        # Append optional operator if it exists
        if optional_operator:
            condition = f"{condition} {optional_operator}"
        
        # Add condition to the corresponding strategy id
        if strg_id not in condition_strings:
            condition_strings[strg_id] = []
        
        condition_strings[strg_id].append(condition)
    
    # Combine conditions for each strategy id
    for strg_id, conditions in condition_strings.items():
        combined_condition = ' '.join(conditions)
        conditions_result[int(strg_id)] = combined_condition
    
    return conditions_result



def generate_hash(plaintext):
    text_bytes = plaintext.encode('utf-8')
    hash_object = hashlib.sha256()
    hash_object.update(text_bytes)
    fixed_identifier = hash_object.hexdigest()
    return fixed_identifier

def set_email(wallet, email):    
    
    with Session(engine) as session:        
        try:                        
            crp = Criptor()
            hash_identifier = generate_hash(wallet)    
            wallety = session.query(Wallet).where(Wallet.identifier == hash_identifier).one_or_none()        
            
            if wallety is not None:
                wallety.email = crp.EncryptIt(email, cfg.Encrypt_Key_DB)                
                session.commit()
            else:
                return {"message": "Wallet not found"}
            
            results_dict = {                
                "email": crp.DecryptIt(wallety.email, cfg.Encrypt_Key_DB)
            }
            
            del crp            
            return results_dict
            
        except:
            session.rollback()
            raise
        
def set_follow_strategy(strategy_set):    
    
    with Session(engine) as session:
        try:
            print(strategy_set)
            # Convert strings to boolean
            # following = strategy_set['following'].lower() == 'true'
            # is_default_strategy = strategy_set['isDefaultStrategy'].lower() == 'true'
            
            following = strategy_set['following']
            is_default_strategy = strategy_set['isDefaultStrategy']
            
            # Check if the strategy already exists
            strategy_already_set = session.query(FollowStrategy).filter(
                FollowStrategy.wallet_id == strategy_set['wallet_id'],
                FollowStrategy.symbol == strategy_set['symbol'],
                FollowStrategy.interval == strategy_set['interval'],
                FollowStrategy.ema1 == strategy_set['ema1'],
                FollowStrategy.ema2 == strategy_set['ema2'],
                FollowStrategy.strategy == strategy_set['strategy'],
                FollowStrategy.is_default_strategy == is_default_strategy
            ).one_or_none()

            if strategy_already_set:
                return  # If strategy already exists, exit early

            # Prepare the new strategy for insertion
            strategy_to_set = FollowStrategy(
                wallet_id=strategy_set['wallet_id'],
                symbol=strategy_set['symbol'],
                interval=strategy_set['interval'],
                ema1=strategy_set['ema1'],
                ema2=strategy_set['ema2'],
                strategy=strategy_set['strategy'],
                is_default_strategy=is_default_strategy,
                following=following,
                update_date=datetime.now(timezone.utc)
            )

            # Add and commit the new strategy
            session.add(strategy_to_set)
            session.commit()

        except Exception as e:
            session.rollback() 
            print(f"Error: {e}")
            raise  # Rethrow the exception if needed

    print('Success')
    
    
def upd_follow_strategy(wallet_id, strategies_set):
        
    try:      
        with Session(engine) as session:
            for strategy in strategies_set:
                print(f"Type of strategy: {type(strategy)}, Content: {strategy}")
                follow_strategy = session.query(FollowStrategy).filter(
                    FollowStrategy.wallet_id == wallet_id,
                    FollowStrategy.follow_id == strategy['follow_id']
                ).one_or_none()

                if follow_strategy:
                    follow_strategy.following = strategy['following']
                else:
                    logging.warning(f"Strategy with follow_id {strategy['follow_id']} not found for wallet_id {wallet_id}.")
            
            session.commit()

    except Exception as e:
        session.rollback()
        logging.error(f"Error updating follow strategies for wallet_id {wallet_id}: {e}")
        raise  
        
        
def get_all_follow_strategies(wallet_id):                
    
        with Session(engine) as session: 
            try:
                result = session.query(FollowStrategy).filter(FollowStrategy.wallet_id == wallet_id).order_by(desc(FollowStrategy.follow_id)).all()
                results_dict = [{"follow_id": row.follow_id,
                                "symbol": row.symbol, 
                                "interval": row.interval,
                                "ema1": row.ema1,
                                "ema2": row.ema2,
                                "strategy":row.strategy,
                                "is_default_strategy": row.is_default_strategy,
                                "following": row.following
                                } for row in result]
                
                return results_dict
            
            except Exception as e:
                session.rollback() 
                print(f"Error: {e}")
                
                
def get_follow_strategies_to_notify():                
    
        with Session(engine) as session: 
            try:              
                
                a = aliased(FollowStrategy)
                b = aliased(Wallet)
                c = aliased(Symbols)

                # SQLAlchemy query
                query = (
                    session.query(a.wallet_id, a.symbol, a.interval, a.ema1, a.ema2, a.strategy, a.is_default_strategy, a.mkt_date_buy, a.mkt_date_sell, b.email, c.symbol_icon)
                    .join(b, a.wallet_id == b.wallet_id) 
                    .join(c, a.symbol == c.symbol_name) 
                    .filter(a.following == True, b.email != None)                          
                    .order_by(a.wallet_id, a.symbol, a.interval, a.is_default_strategy) 
)

                # Execute the query and fetch results               
                result = query.all()
                
                crp = Criptor()
                
                results_dict = [{"symbol": row.symbol, 
                                "wallet_id": row.wallet_id,
                                "interval": row.interval,
                                "ema1": row.ema1,
                                "ema2": row.ema2,
                                "strategy":row.strategy,
                                "is_default_strategy": row.is_default_strategy,
                                "email": crp.DecryptIt(row.email, cfg.Encrypt_Key_DB),
                                "symbol_icon" : row.symbol_icon,
                                "mkt_date_buy" : row.mkt_date_buy,                                
                                "mkt_date_sell" : row.mkt_date_sell                                
                                } for row in result]
                
                del crp
                
                return results_dict
            
            except Exception as e:
                session.rollback() 
                print(f"Error: {e}")
                
def get_follow_strategies_by_follower(follower, symbol):                
    
    with Session(engine) as session: 
        try:              
            
            a = aliased(FollowStrategy)               

            # SQLAlchemy query
            query = (
                session.query(a.interval, a.ema1, a.ema2, a.strategy, a.is_default_strategy, a.following)                    
                .filter(a.wallet_id == follower, a.symbol == symbol))

            # Execute the query and fetch results               
            result = query.all()
            
            
            
            results_dict = [{
                            "interval": row.interval,
                            "ema1": row.ema1,
                            "ema2": row.ema2,
                            "strategy":row.strategy,
                            "is_default_strategy": row.is_default_strategy,
                            "following": row.following                                                           
                            } for row in result]               
            
            
            return results_dict
        
        except Exception as e:
            session.rollback() 
            print(f"Error: {e}")
        
    
def upd_follow_strategies_mkt_date(notifications):     
    with Session(engine) as session:
        try:
            for notification in notifications:
                follow_strategy = session.query(FollowStrategy).filter(
                    FollowStrategy.symbol == notification['symbol'],
                    FollowStrategy.wallet_id == notification['user_wallet_id'],
                    FollowStrategy.is_default_strategy == (notification['wallet_id'] == 0),
                    FollowStrategy.interval == notification['interval'],
                    FollowStrategy.strategy == notification['strategy'],
                    FollowStrategy.ema1 == notification['ema_1'],
                    FollowStrategy.ema2 == notification['ema_2']
                ).one_or_none()

                if follow_strategy:
                    if(notification['rule_match'] == 'buy'):
                        follow_strategy.mkt_date_buy = notification['date_mkt'] 
                    else:
                        follow_strategy.mkt_date_sell = notification['date_mkt'] 
                    
            session.commit()
                
        except Exception as e:
            session.rollback() 
            print(f"Error: {e}")
            raise 
        
def get_set_symbol_description(symbol):    
    
    with Session(engine) as session:
        try:
          
            # Check if the symbol_description already exists
            symbol_description = session.query(Symbol_Description).filter(                
                Symbol_Description.symbol == symbol,
            ).first()

            if symbol_description is not None:
                return  [{'symbol': symbol_description.symbol , 'desc': symbol_description.description}]
            
            description = asyncio.run(get_crypto_description(symbol))

            # if the description do not exists, create it
            symbol_description = insert(Symbol_Description).values(
                symbol=symbol,
                description = description,
                update_date=datetime.now(timezone.utc)
            ).returning(Symbol_Description.symbol, Symbol_Description.description)

            result = session.execute(symbol_description).fetchone()
            session.commit()
            row = result
        
            results_dict = [{
                "symbol": row.symbol,                
                "desc": row.description
            }]
            
            return results_dict

        except Exception as e:
            session.rollback() 
            print(f"Error: {e}")
            raise 
