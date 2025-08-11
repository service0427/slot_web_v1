// 데이터베이스 연결 설정

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// 환경변수에서 데이터베이스 설정 가져오기
export const getDatabaseConfig = (): DatabaseConfig => {
  const config: DatabaseConfig = {
    host: import.meta.env.VITE_DATABASE_HOST || 'localhost',
    port: parseInt(import.meta.env.VITE_DATABASE_PORT || '5432'),
    database: import.meta.env.VITE_DATABASE_NAME || 'slot_system',
    user: import.meta.env.VITE_DATABASE_USER || 'postgres',
    password: import.meta.env.VITE_DATABASE_PASSWORD || '',
    ssl: import.meta.env.PROD,
    max: 20, // 최대 연결 수
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  // DATABASE_URL이 있으면 파싱
  if (import.meta.env.VITE_DATABASE_URL) {
    try {
      const url = new URL(import.meta.env.VITE_DATABASE_URL);
      config.host = url.hostname;
      config.port = parseInt(url.port) || 5432;
      config.database = url.pathname.slice(1);
      config.user = url.username;
      config.password = url.password;
    } catch (error) {
      console.error('DATABASE_URL 파싱 실패:', error);
    }
  }

  return config;
};

// 데이터베이스 연결 상태 확인
export const checkDatabaseConnection = async (): Promise<boolean> => {
  // 실제 구현은 데이터베이스 클라이언트 라이브러리 설치 후
  // 여기서는 연결 테스트만 시뮬레이션
  try {
    const config = getDatabaseConfig();
    console.log('데이터베이스 연결 설정:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      // 비밀번호는 로그에 표시하지 않음
    });
    
    // TODO: 실제 연결 테스트 구현
    // const client = new Client(config);
    // await client.connect();
    // await client.end();
    
    return true;
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
    return false;
  }
};

// SQL 쿼리 빌더 헬퍼 (기본적인 것들)
export const queryHelpers = {
  // SELECT 쿼리 생성
  select: (table: string, fields: string[] = ['*'], conditions?: Record<string, any>) => {
    let query = `SELECT ${fields.join(', ')} FROM ${table}`;
    const values: any[] = [];
    
    if (conditions && Object.keys(conditions).length > 0) {
      const whereClause = Object.entries(conditions)
        .map(([key, _], index) => `${key} = $${index + 1}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }
    
    return { query, values };
  },

  // INSERT 쿼리 생성
  insert: (table: string, data: Record<string, any>) => {
    const fields = Object.keys(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const values = Object.values(data);
    
    return { query, values };
  },

  // UPDATE 쿼리 생성
  update: (table: string, data: Record<string, any>, conditions: Record<string, any>) => {
    const updateFields = Object.keys(data);
    const conditionFields = Object.keys(conditions);
    
    const setClause = updateFields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(', ');
    
    const whereClause = conditionFields
      .map((field, index) => `${field} = $${updateFields.length + index + 1}`)
      .join(' AND ');
    
    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    const values = [...Object.values(data), ...Object.values(conditions)];
    
    return { query, values };
  },

  // DELETE 쿼리 생성
  delete: (table: string, conditions: Record<string, any>) => {
    const whereClause = Object.entries(conditions)
      .map(([key, _], index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
    const values = Object.values(conditions);
    
    return { query, values };
  }
};

// 트랜잭션 헬퍼
export class TransactionHelper {
  // 트랜잭션 시작
  static async begin() {
    // TODO: 실제 구현
    return 'BEGIN';
  }

  // 트랜잭션 커밋
  static async commit() {
    // TODO: 실제 구현
    return 'COMMIT';
  }

  // 트랜잭션 롤백
  static async rollback() {
    // TODO: 실제 구현
    return 'ROLLBACK';
  }

  // 트랜잭션 래퍼
  static async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      await this.begin();
      const result = await callback();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}