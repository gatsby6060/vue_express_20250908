const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

const app = express();
app.use(cors());

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.')); // .은 경로

const config = {
  user: 'SYSTEM',
  password: 'test1234',
  connectString: 'localhost:1521/xe'
};

// Oracle 데이터베이스와 연결을 유지하기 위한 전역 변수
let connection;

// 데이터베이스 연결 설정
async function initializeDatabase() {
  try {
    connection = await oracledb.getConnection(config);
    console.log('Successfully connected to Oracle database');
  } catch (err) {
    console.error('Error connecting to Oracle database', err);
  }
}

initializeDatabase();

// 엔드포인트
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/emp/list', async (req, res) => {
  const { deptNo } = req.query;
  let query = "";
  if(deptNo != "" && deptNo != null ){
    query += `WHERE E.DEPTNO = ${deptNo} `
  }
  try {
    const result = await connection.execute(
      `SELECT E.*,D.DNAME FROM EMP E `
      + `INNER JOIN DEPT D ON E.DEPTNO = D.DEPTNO `
      + query
      + ` ORDER BY SAL DESC`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    //리턴
    res.json({
        result : "success",
        empList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/emp/delete', async (req, res) => {
  const { empNo } = req.query;

  try {
    await connection.execute(
      // `INSERT INTO STUDENT (STU_NO, STU_NAME, STU_DEPT) VALUES (${stuNo}, '${name}', '${dept}')`,
      `DELETE FROM EMP WHERE EMPNO = :empNo`,
      [empNo],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});




app.get('/prof/list', async (req, res) => {
  const { position } = req.query;
  let query = "";
  if(position != "" && position != null){
    query += `WHERE POSITION = '${position}'`;
  }
  // console.log("당최?")
  // console.log(query);
  try {
    const result = await connection.execute(
        `SELECT * FROM PROFESSOR `
        + query
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    //리턴
    res.json({
        result : "success",
        profList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});




app.get('/prof/delete', async (req, res) => {
  const { profNo } = req.query;
  
  try {
    await connection.execute(
      // `INSERT INTO STUDENT (STU_NO, STU_NAME, STU_DEPT) VALUES (${stuNo}, '${name}', '${dept}')`,
      // `DELETE FROM PROFESSOR WHERE PROFNO = :profNo`,
      `DELETE FROM PROFESSOR WHERE PROFNO = '${profNo}'`,
      [],// ${} 이방식 쓰려면 왼쪽 [] 를 이렇게 []로 해야함
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});





app.get('/emp/insert', async (req, res) => {
  const { empNo, eName, job, selectDept } = req.query;

  try {
    await connection.execute(
      // `INSERT INTO STUDENT (STU_NO, STU_NAME, STU_DEPT) VALUES (${stuNo}, '${name}', '${dept}')`,
      `INSERT INTO EMP(EMPNO, ENAME, JOB, DEPTNO) VALUES(:empNo, :eName, :job, :selectDept)`,
      [empNo, eName, job, selectDept],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});






app.get('/emp/info', async (req, res) => {
  const { empNo } = req.query;
  try {
    const result = await connection.execute(
      `SELECT E.*, DNAME, EMPNO "empNo", ENAME "eName", JOB "job", E.DEPTNO "selectDept" `
      + `FROM EMP E `
      + `INNER JOIN DEPT D ON E.DEPTNO = D.DEPTNO `
      + `WHERE E.EMPNO = ${empNo} `
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    //리턴
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});






app.get('/emp/update', async (req, res) => {
  const {  job, eName, selectDept, empNo } = req.query;
  console.log(empNo, job, eName, selectDept)
  try {
    await connection.execute(
      `UPDATE EMP SET `
      +` JOB = :job, ENAME = :eName, DEPTNO = :selectDept `
      +` WHERE EMPNO = :empNo`,
      [ job, eName, selectDept, empNo],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing update', error);
    res.status(500).send('Error executing update');
  }
});








app.get('/prof/info', async (req, res) => {
  const { profNo } = req.query; //제발 클라이언트에서 보낼때 대소문자와 받을 때 대소문자 일치!!!!
  console.log("서버의 profNo는~ "+ profNo );
  try {
    const result = await connection.execute(
      `SELECT P.*, PROFNO "profNo", NAME "name", ID "id", POSITION "position", PAY "pay" `
      + `FROM PROFESSOR P `
      + `WHERE PROFNO = ${profNo} `
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    //리턴
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});








app.get('/prof/update', async (req, res) => {
  const { name, id, position, pay, profNo } = req.query;
  // console.log(NAME, POSITON, DEPTNO, PROFNO);
  try {
    await connection.execute(
      `UPDATE PROFESSOR SET `
      +` NAME = :name, ID = :id, POSITION = :position, PAY = :pay `
      +` WHERE PROFNO = :profNo`,
      [ name, id, position, pay, profNo],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing update', error);
    res.status(500).send('Error executing update');
  }
});












// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});
