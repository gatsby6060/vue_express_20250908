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
  const { deptNo, pageSize, offset } = req.query;
  // console.log("deptNo는 "+deptNo);
  // console.log("pageSize는 "+pageSize);
  // console.log("offset는 "+offset);
  let query = "";
  if(deptNo != "" && deptNo != null ){
    query += `WHERE E.DEPTNO = ${deptNo} `
  }
  try {
    const result = await connection.execute(
      `SELECT E.*,D.DNAME FROM EMP E `
      + `INNER JOIN DEPT D ON E.DEPTNO = D.DEPTNO `
      + query
      + ` ORDER BY SAL DESC `
      + ` OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY `
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

    const count = await connection.execute(
    `SELECT COUNT(*) FROM EMP E`
    );
    //리턴
    res.json({
        result : "success",
        empList : rows,
        count : count.rows[0][0]
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

app.get('/emp/deleteAll', async (req, res) => {
  const { removeList } = req.query;
  console.log(removeList);
  let query = "DELETE FROM EMP WHERE EMPNO IN (";
  for(let i=0; i<removeList.length; i++){
    query += removeList[i];
    if(removeList.length-1 != i){query +=","}
  }
  query += ")"
  console.log(query);
  try {
    await connection.execute(
      query,
      [],
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


app.get('/prof/deleteAll', async (req, res) => {
  const { removeList } = req.query;
  console.log(removeList);
  let query = "DELETE FROM PROFESSOR WHERE PROFNO IN (";
  for(let i=0; i<removeList.length; i++){
    query += removeList[i];
    if(removeList.length-1 != i){query +=","} //마지막이면 ,안찍으려고...
  }
  query += ")"
  console.log(query);
  try {
    await connection.execute(
      query,
      [],
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





app.get('/board/add', async (req, res) => {
  const { kind, title, contents, userId } = req.query;
  // console.log("kind는 " + kind);
  // console.log("title " + title);
  // console.log("contents " + contents);
  // console.log("userId " + userId);
  try {
    await connection.execute(
      `INSERT INTO TBL_BOARD VALUES ( board_seq.nextval, :title, :contents, :userId , 0, 0, :kind, SYSDATE, SYSDATE ) `,
      [title, contents, userId, kind],
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





app.get('/board/list', async (req, res) => {
  let { pageSize, offset } = req.query;
  if( pageSize == null ){
    pageSize = 5;
  }
  if( offset == null ){
    offset = 1;
  }
  try {
    const result = await connection.execute(
      `SELECT B.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TBL_BOARD B `
      +`OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY `
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

    const count = await connection.execute(
      `SELECT COUNT(*) FROM TBL_BOARD B`
    );
    // console.log(count.rows[0][0]);
    // 리턴
    res.json({
        result : "success",
        list : rows,
        count : count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});




app.get('/board/view', async (req, res) => {
   const { boardNo } = req.query;
  //  console.log("boardNo는 "+boardNo);
  try {
    const result = await connection.execute(
      `SELECT * `
      + `FROM TBL_BOARD `
      + `WHERE boardNo = ${boardNo} `
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


app.get('/login', async (req, res) => {
  const { userId, pwd } = req.query;
  let query = `SELECT * FROM TBL_USER WHERE USERID = '${userId}' AND PASSWORD = '${pwd}'`
  try {
    const result = await connection.execute(query);
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
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});







app.get('/cms/login', async (req, res) => {

  const { loginId, pwd } = req.query;
 
  let query = `SELECT * FROM SYSTEM_USER WHERE LOGIN_ID = '${loginId}' AND PASSWORD = '${pwd}'`
  try {
    const result = await connection.execute(query);
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
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});


app.get('/cms/custlist', async (req, res) => {
  const { pageSize = 5 , offset = 0 } = req.query;
  try {
    const result = await connection.execute(
      `select * from TBL_CMS_CUST_PROFILE `
      + ` ORDER BY CDATETIME DESC NULLS LAST, MEMBER_NO DESC `
      +`OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY `
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

    const count = await connection.execute(
      `SELECT COUNT(*) FROM TBL_CMS_CUST_PROFILE`
    );
    // console.log(count.rows[0][0]);
    // 리턴
    res.json({
        result : "success",
        list : rows,
        count : count.rows[0][0]
    });

  } catch (e) {
    console.error(e);
    res.status(500).send('Error executing query');
  }
});



//사라전 초기 서버 자료----------------------------------------------------------------------S

//조회수 +1 업데이트 목적///////////////////////////////////////////////////////
app.get('/cntupdate', async (req, res) => {
  const { boardNo } = req.query;

  try {
    await connection.execute(
      `UPDATE TBL_BOARD SET CNT = CNT+1 WHERE BOARDNO = :boardNo`,
      [boardNo],
      { autoCommit: true }
    );
    res.json({
      result: "success"
    });
  } catch (error) {
    console.error('Error executing update', error);
    res.status(500).send('Error executing update');
  }
});
//조회수 +1 업데이트 목적///////////////////////////////////////////////////////


//인서트 목적------------------------------------------------------------S

app.get('/board/insert', async (req, res) => {
  const { title, userId, contents, kind } = req.query;
  let query = `INSERT INTO TBL_BOARD `
              +`VALUES(B_SEQ.NEXTVAL, '${title}', '${contents}', '${userId}', 0, 0, ${kind}, SYSDATE, SYSDATE)`;
  console.log(query);
  try {
    await connection.execute(
      query,
      [],
      { autoCommit: true }
    );
    res.json({
      result: "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

//인서트 목적------------------------------------------------------------E



//보드테이블 내용업데이트목적------------------------------------------------------S
app.get('/board/update', async (req, res) => {
  const { boardNo, title, userId, contents, kind } = req.query; //보낼때의 값을 잘 맞춰서 적어줘야 인식함
  let query = `UPDATE TBL_BOARD SET `
              + `TITLE = '${title}', ` 
              + `CONTENTS = '${contents}', ` 
              + `USERID = '${userId}', ` 
              + `KIND = '${kind}', `
              + `UDATETIME = SYSDATE `
              + `WHERE BOARDNO = ${boardNo}`;
  console.log(query);

  try {
    await connection.execute(
      query,
      [],
      { autoCommit: true }
    );
    res.json({
      result: "success"
    });
  } catch (error) {
    console.error('Error executing update', error);
    res.status(500).send('Error executing update');
  }
});
//보드테이블 내용업데이트목적------------------------------------------------------E





app.get('/login', async (req, res) => {
  const { userId, pwd } = req.query; //보낼때의 이름 맞춰서...
  let query = `SELECT * FROM TBL_USER WHERE USERID= '${userId}' AND PASSWORD = '${pwd}'`
  try {
    const result = await connection.execute(query);
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
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});






app.get('/user/info', async (req, res) => {
  const { userId } = req.query; //보낼때의 이름 맞춰서... 받을것은 userId임
  console.log(userId);

  let query = `SELECT * FROM TBL_USER WHERE USERID= '${userId}' `
  try {
    const result = await connection.execute(query);
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
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});


app.get('/search', async (req, res) => {
  const { stuNo } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM STUDENT WHERE STU_NO = ${stuNo}`);
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
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/insert', async (req, res) => {
  const { stuNo, name, dept } = req.query;

  try {
    await connection.execute(
      `INSERT INTO STUDENT (STU_NO, STU_NAME, STU_DEPT) VALUES (:stuNo, :name, :dept)`,
      [stuNo, name, dept],
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


app.get('/update', async (req, res) => {
  const { stuNo, name, dept } = req.query;

  try {
    await connection.execute(
      `UPDATE STUDENT SET STU_NAME = :name, STU_DEPT = :dept WHERE STU_NO = :stuNo`,
      [name, dept, stuNo],
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


app.get('/delete', async (req, res) => {
  const { stuNo } = req.query;

  try {
    await connection.execute(
      `DELETE FROM STUDENT WHERE STU_NO = :stuNo`,
      [stuNo],
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

// board
app.get('/list', async (req, res) => {
  const { option, keyword } = req.query;
  
  let subQuery = "";
  if(option == "all"){
    subQuery = `WHERE TITLE LIKE '%${keyword}%' OR USERID LIKE '%${keyword}%'`;
  } else if(option == "title"){
    subQuery = `WHERE TITLE LIKE '%${keyword}%'`;
  } else if(option == "user"){
    subQuery = `WHERE USERID LIKE '%${keyword}%'`;
  }
  let query = 
      `SELECT B.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') CTIME `
    + `FROM TBL_BOARD B ` + subQuery;
  try {
    const result = await connection.execute(query);
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
    res.json({
        result : "success",
        list : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

//사라전 초기 서버 자료----------------------------------------------------------------------E












app.get('/cms/customerinfo/', async (req, res) => {
   const { memberNo } = req.query;
   console.log("memberNo는 "+memberNo);
  try {
    const result = await connection.execute(
      `SELECT * `
      + `FROM tbl_cms_cust_profile `
      + `WHERE MEMBER_NO = '${memberNo}' `
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





// 예: app.get 방식(네 스타일)
app.get('/cms/customerinsert', async (req, res) => {
  // 쿼리 파라미터 받기 (memberNo 없음: 트리거 자동 생성)
  const {
    loginId,
    password,        // 미전달이면 트리거가 랜덤 생성
    name,
    pr,
    address,
    email,
    phone,
    birthYear,       // NUMBER(4,0)
    height,          // NUMBER(5,2)
    weight,          // NUMBER(5,2)
    bloodType,
    religion,
    hobby,
    mainPhotoUrl,
    gender,          // 'M' | 'F' | 'N'  (없으면 'N'으로 세팅)
    certs
  } = req.query;

  try {
    // 숫자 컬럼은 숫자 변환(문자 보내도 Oracle이 암시변환될 때 NLS 이슈 대비)
    const birthYearNum = (birthYear === undefined || birthYear === '') ? null : Number(birthYear);
    const heightNum    = (height === undefined || height === '') ? null : Number(height);
    const weightNum    = (weight === undefined || weight === '') ? null : Number(weight);

    // gender 미지정 시 'N'
    const genderVal = (gender && String(gender).trim() !== '')
      ? String(gender).toUpperCase()
      : 'N';

    // INSERT: MEMBER_NO, CDATETIME, UDATETIME은 테이블 디폴트/트리거 사용
    const sql = `
      INSERT INTO TBL_CMS_CUST_PROFILE
      (
        LOGIN_ID, PASSWORD, NAME, PR, ADDRESS, EMAIL, PHONE,
        BIRTH_YEAR, HEIGHT, WEIGHT, BLOOD_TYPE, RELIGION, HOBBY,
        MAIN_PHOTO_URL, GENDER, CERTS
      )
      VALUES
      (
        :loginId, :password, :name, :pr, :address, :email, :phone,
        :birthYear, :height, :weight, :bloodType, :religion, :hobby,
        :mainPhotoUrl, :gender, :certs
      )
    `;

    await connection.execute(
      sql,
      [
        loginId || null,
        // password: null이면 트리거가 자동 생성
        (password && password.trim() !== '') ? password : null,
        name || null,
        pr || null,
        address || null,
        email || null,
        phone || null,
        birthYearNum,
        heightNum,
        weightNum,
        bloodType || null,
        religion || null,
        hobby || null,
        mainPhotoUrl || null,
        genderVal,              // 기본 'N'
        certs || null
      ],
      { autoCommit: true }
    );

    res.json({ result: "success" });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});










// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});
