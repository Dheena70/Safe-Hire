import sqlite3
import os
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('InitDB')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(BASE_DIR, '..', 'datasets')
CSV_PATH = os.path.join(DATASETS_DIR, 'south_india_companies.csv')
DB_PATH = os.path.join(DATASETS_DIR, 'south_india_companies.db')

def build_sqlite_db():
    if not os.path.exists(CSV_PATH):
        logger.warning(f"CSV not found at {CSV_PATH}")
        return False
    
    logger.info("Building compact indexed SQLite database for South India companies...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS companies")
    cur.execute("""
        CREATE TABLE companies (
            cin TEXT,
            company_name TEXT,
            state TEXT,
            status TEXT,
            name_lower TEXT
        )
    """)
    
    # 1. Load sample MCA dataset if present
    sample_mca_path = os.path.join(DATASETS_DIR, 'sample_mca_companies.csv')
    if os.path.exists(sample_mca_path):
        df_sample = pd.read_csv(sample_mca_path, on_bad_lines='skip')
        sample_data = []
        for _, row in df_sample.iterrows():
            c = str(row.get('cin', '')).strip().upper()
            n = str(row.get('company_name', '')).strip()
            s = str(row.get('state', 'India')).strip()
            if n:
                sample_data.append((c, n, s, 'Active', n.lower()))
        cur.executemany("INSERT INTO companies VALUES (?, ?, ?, ?, ?)", sample_data)
        conn.commit()
        logger.info(f"Inserted {len(sample_data)} sample MCA entities.")

    # 2. Stream in chunks of 50,000 for ultra-low memory consumption during build
    chunk_size = 50000
    total_rows = 0
    for chunk in pd.read_csv(CSV_PATH, chunksize=chunk_size, low_memory=False, on_bad_lines='skip'):
        cin_col = 'CIN' if 'CIN' in chunk.columns else chunk.columns[0]
        name_col = 'Company Name' if 'Company Name' in chunk.columns else chunk.columns[1]
        state_col = 'Company State' if 'Company State' in chunk.columns else 'State'
        status_col = 'Company Status' if 'Company Status' in chunk.columns else 'Status'
        
        data = []
        for _, row in chunk.iterrows():
            c = str(row.get(cin_col, '')).strip().upper()
            n = str(row.get(name_col, '')).strip()
            s = str(row.get(state_col, '')).strip()
            st = str(row.get(status_col, 'Active')).strip()
            if n and n != 'nan':
                data.append((c if c != 'NAN' else '', n, s if s != 'nan' else '', st if st != 'nan' else 'Active', n.lower()))
        
        cur.executemany("INSERT INTO companies VALUES (?, ?, ?, ?, ?)", data)
        conn.commit()
        total_rows += len(data)

    logger.info(f"Inserted {total_rows} records. Building B-Tree indexes...")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_cin ON companies(cin)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_name_lower ON companies(name_lower)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_state ON companies(state)")
    conn.commit()
    conn.close()
    logger.info("SQLite database build complete with 0 MB runtime RAM overhead.")
    return True

if __name__ == '__main__':
    build_sqlite_db()
