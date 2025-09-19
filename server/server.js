const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');
const multer = require('multer'); //250917추가
require('dotenv').config();   // 250918 지도 때문에 추가 .env 로드



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
  if (deptNo != "" && deptNo != null) {
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
      result: "success",
      empList: rows,
      count: count.rows[0][0]
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
      result: "success"
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
  for (let i = 0; i < removeList.length; i++) {
    query += removeList[i];
    if (removeList.length - 1 != i) { query += "," }
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
      result: "success"
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
  for (let i = 0; i < removeList.length; i++) {
    query += removeList[i];
    if (removeList.length - 1 != i) { query += "," } //마지막이면 ,안찍으려고...
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
      result: "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});




app.get('/prof/list', async (req, res) => {
  const { position } = req.query;
  let query = "";
  if (position != "" && position != null) {
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
      result: "success",
      profList: rows
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
      result: "success"
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
      result: "success"
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
      result: "success",
      info: rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});






app.get('/emp/update', async (req, res) => {
  const { job, eName, selectDept, empNo } = req.query;
  console.log(empNo, job, eName, selectDept)
  try {
    await connection.execute(
      `UPDATE EMP SET `
      + ` JOB = :job, ENAME = :eName, DEPTNO = :selectDept `
      + ` WHERE EMPNO = :empNo`,
      [job, eName, selectDept, empNo],
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








app.get('/prof/info', async (req, res) => {
  const { profNo } = req.query; //제발 클라이언트에서 보낼때 대소문자와 받을 때 대소문자 일치!!!!
  console.log("서버의 profNo는~ " + profNo);
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
      result: "success",
      info: rows[0]
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
      + ` NAME = :name, ID = :id, POSITION = :position, PAY = :pay `
      + ` WHERE PROFNO = :profNo`,
      [name, id, position, pay, profNo],
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
      result: "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});





app.get('/board/list', async (req, res) => {
  let { pageSize, offset } = req.query;
  if (pageSize == null) {
    pageSize = 1115;
  }
  if (offset == null) {
    offset = 1;
  }
  try {
    const result = await connection.execute(
      `SELECT B.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TBL_BOARD B `
      + `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY `
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
      result: "success",
      list: rows,
      count: count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});




app.get('/board/view', async (req, res) => {
  const { boardNo } = req.query;
  console.log("boardNo는 " + boardNo);
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
      result: "success",
      info: rows[0]
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
    let result = await connection.execute(query);
    let columnNames = result.metaData.map(column => column.name);

    if (result.rows.length <= 0) {
      // console.log("진입");
      query = `SELECT MEMBER_NO AS LOGIN_ID , NAME FROM tbl_cms_cust_profile WHERE MEMBER_NO = '${loginId}' AND PASSWORD = '${pwd}'`
      result = await connection.execute(query);
      columnNames = result.metaData.map(column => column.name);
    }

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

// 250917 18시48분 잠시 주석
// app.get('/cms/custlist', async (req, res) => {
//   const { pageSize = 5, offset = 0 } = req.query;
//   try {
//     const result = await connection.execute(
//       `select * from TBL_CMS_CUST_PROFILE `
//       + ` ORDER BY CDATETIME DESC NULLS LAST, MEMBER_NO DESC `
//       + `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY `
//     );

//     const columnNames = result.metaData.map(column => column.name);
//     // 쿼리 결과를 JSON 형태로 변환
//     const rows = result.rows.map(row => {
//       // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
//       const obj = {};
//       columnNames.forEach((columnName, index) => {
//         obj[columnName] = row[index];
//       });
//       return obj;
//     });

//     const count = await connection.execute(
//       `SELECT COUNT(*) FROM TBL_CMS_CUST_PROFILE`
//     );
//     // console.log(count.rows[0][0]);
//     // 리턴
//     res.json({
//       result: "success",
//       list: rows,
//       count: count.rows[0][0]
//     });

//   } catch (e) {
//     console.error(e);
//     res.status(500).send('Error executing query');
//   }
// });


app.get('/cms/custlist', async (req, res) => {
  let {
    option = 'all',
    keyword = '',
    gender = '',
    pageSize = 10,
    offset = 0,
    sStatus = '',    // 'active'면 직원
    loginId = ''     // 현재 로그인 ID
  } = req.query;

  const isEmpActive = String(sStatus).trim() === 'active';

  // 보드 스타일: 문자열로 WHERE 구성 (초간단)
  // 최소 인젝션 회피: 작은따옴표만 이스케이프
  const kw = String(keyword || '').trim().toLowerCase().replace(/'/g, "''");

  const g = String(gender || '').trim().toUpperCase(); // 'M' | 'F' | 'N' | ''

  // 고객이 name 검색 시도하면 이름 제외(all처럼 동작)
  if (!isEmpActive && option === 'name') option = 'all';

  // 공개 동의 필터(없으면 지워도 됨)
  // const where = [`B.IS_PUBLIC = 'Y'`];
  let where = [];
  console.log(kw);
  console.log(option);

  // ▼ 성별 전용 필터
  if (option === 'gender') {
    if (['M', 'F', 'N'].includes(g)) {
      where.push(`B.GENDER = '${g}'`);
    }
    // g가 빈값이면(=전체) 아무 필터도 추가하지 않음
  } else if (kw) {
    // if (kw) {
    if (option === 'name' && isEmpActive) {
      where.push(`LOWER(B.NAME) LIKE '%${kw}%' `);
    } else if (option === 'region') {
      where.push(`LOWER(B.ADDRESS) LIKE '%${kw}%' `);
    } else if (option === 'job') {
      where.push(`LOWER(B.PR) LIKE '%${kw}%' `);
    } else if (option === 'birthYear') {
      // 숫자면 = 비교, 아니면 LIKE
      const onlyNum = kw.replace(/\D/g, '');
      if (onlyNum) where.push(`B.BIRTH_YEAR = ${onlyNum}`);
      else where.push(`CAST(B.BIRTH_YEAR AS VARCHAR2(10)) LIKE '%${kw}%' `);
    } else {
      // all: 직원은 이름 포함, 고객은 이름 제외
      const parts = [];
      if (isEmpActive) parts.push(`LOWER(B.NAME) LIKE '%${kw}%' `);
      parts.push(`LOWER(B.MEMBER_NO) LIKE '%${kw}%' `);
      parts.push(`LOWER(B.ADDRESS) LIKE '%${kw}%' `);
      parts.push(`LOWER(B.PR) LIKE '%${kw}%' `);
      parts.push(`CAST(B.BIRTH_YEAR AS VARCHAR2(10)) LIKE '%${kw}%' `);
      where.push(`(${parts.join(' OR ')}) `);
    }
  }

  const subQuery = where.length ? `WHERE ${where.join(' AND ')} ` : '';

  // 직원은 이름 그대로, 고객은 본인 작성만 이름 노출
  const nameSelect = isEmpActive
    ? `B.NAME `
    : `(CASE WHEN B.CREATEBY = '${String(loginId || '').replace(/'/g, "''")}' THEN B.NAME ELSE NULL END) AS NAME `;

  // 페이징 숫자형 보정
  pageSize = Number(pageSize) || 10;
  offset = Number(offset) || 0;

  // Oracle 12c+ 기준 페이징. 
  const listQuery =
    `SELECT
       B.MEMBER_NO,
       ${nameSelect},
       B.BIRTH_YEAR,
       B.HEIGHT,
       B.WEIGHT,
       B.GENDER,
       B.MAIN_PHOTO_URL,
       B.CREATEBY,
       B.*
     FROM TBL_CMS_CUST_PROFILE B
     ${subQuery}
     ORDER BY B.MEMBER_NO DESC
     OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY `;

  const countQuery =
    `SELECT COUNT(*) AS CNT
     FROM TBL_CMS_CUST_PROFILE B
     ${subQuery} `;

  try {
    const countResult = await connection.execute(countQuery);
    const total = (countResult.rows && countResult.rows[0] && countResult.rows[0][0]) || 0;

    const result = await connection.execute(listQuery);
    const columnNames = result.metaData.map(c => c.name);
    const rows = result.rows.map(r => {
      const o = {};
      columnNames.forEach((col, i) => o[col] = r[i]);
      return o;
    });

    res.json({ result: 'success', count: total, list: rows });
  } catch (err) {
    console.error('custlist error', err);
    res.status(500).json({ result: 'error', message: 'Error executing query' });
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
    + `VALUES(B_SEQ.NEXTVAL, '${title}', '${contents}', '${userId}', 0, 0, ${kind}, SYSDATE, SYSDATE)`;
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
      result: "success"
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
      result: "success"
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
      result: "success"
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
  if (option == "all") {
    subQuery = `WHERE TITLE LIKE '%${keyword}%' OR USERID LIKE '%${keyword}%'`;
  } else if (option == "title") {
    subQuery = `WHERE TITLE LIKE '%${keyword}%'`;
  } else if (option == "user") {
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
      result: "success",
      list: rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

//사라전 초기 서버 자료----------------------------------------------------------------------E












app.get('/cms/customerinfo/', async (req, res) => {
  const { memberNo } = req.query;
  // console.log("memberNo는 " + memberNo);
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
      result: "success",
      info: rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});





// 예: app.get 방식(네 스타일)
// app.get('/cms/customerinsert', async (req, res) => {
//   // 쿼리 파라미터 받기 (memberNo 없음: 트리거 자동 생성)
//   const {
//     loginId,
//     password,        // 미전달이면 트리거가 랜덤 생성
//     name,
//     pr,
//     address,
//     email,
//     phone,
//     birthYear,       // NUMBER(4,0)
//     height,          // NUMBER(5,2)
//     weight,          // NUMBER(5,2)
//     bloodType,
//     religion,
//     hobby,
//     mainPhotoUrl,
//     gender,          // 'M' | 'F' | 'N'  (없으면 'N'으로 세팅)
//     certs,
//     createby,
//     // educations
//   } = req.query;

//   try {
//     // 숫자 컬럼은 숫자 변환(문자 보내도 Oracle이 암시변환될 때 NLS 이슈 대비)
//     const birthYearNum = (birthYear === undefined || birthYear === '') ? null : Number(birthYear);
//     const heightNum = (height === undefined || height === '') ? null : Number(height);
//     const weightNum = (weight === undefined || weight === '') ? null : Number(weight);

//     // gender 미지정 시 'N'
//     const genderVal = (gender && String(gender).trim() !== '')
//       ? String(gender).toUpperCase()
//       : 'N';

//     // INSERT: MEMBER_NO, CDATETIME, UDATETIME은 테이블 디폴트/트리거 사용
//     const sql = `
//       INSERT INTO TBL_CMS_CUST_PROFILE
//       (
//         LOGIN_ID, PASSWORD, NAME, PR, ADDRESS, EMAIL, PHONE,
//         BIRTH_YEAR, HEIGHT, WEIGHT, BLOOD_TYPE, RELIGION, HOBBY,
//         MAIN_PHOTO_URL, GENDER, CERTS, CREATEBY
//       )
//       VALUES
//       (
//         :loginId, :password, :name, :pr, :address, :email, :phone,
//         :birthYear, :height, :weight, :bloodType, :religion, :hobby,
//         :mainPhotoUrl, :gender, :certs, :createby
//       )
//     `;

//     await connection.execute(
//       sql,
//       [
//         loginId || null,
//         // password: null이면 트리거가 자동 생성
//         (password && password.trim() !== '') ? password : null,
//         name || null,
//         pr || null,
//         address || null,
//         email || null,
//         phone || null,
//         birthYearNum,
//         heightNum,
//         weightNum,
//         bloodType || null,
//         religion || null,
//         hobby || null,
//         mainPhotoUrl || null,
//         genderVal,              // 기본 'N'
//         certs || null,
//         createby || null
//       ],
//       { autoCommit: true }
//     );

//     res.json({ result: "success" });
//   } catch (error) {
//     console.error('Error executing insert', error);
//     res.status(500).send('Error executing insert');
//   }
// });

app.get('/cms/customerinsert', async (req, res) => {
  const {
    loginId, password, name, pr, address, email, phone,
    birthYear, height, weight, bloodType, religion, hobby,
    mainPhotoUrl, gender, certs, createby,
    educations,   // ★ 프론트에서 JSON.stringify([...]) 로 보냄
    lat, lng // ⬅️ 클라에서 온 좌표
  } = req.query;

  const toNum = v => (v === undefined || v === '' ? null : Number(v));
  const txOpts = { autoCommit: false };

  try {
    // ⬇️ 클라에서 준 좌표만 사용
    const latNum = toNum(lat);
    const lngNum = toNum(lng);

    // 1) 고객 INSERT + 새 MEMBER_NO 받기
    // 1) 프로필 INSERT (좌표 포함)
    const r1 = await connection.execute(
      `INSERT INTO TBL_CMS_CUST_PROFILE
       ( LOGIN_ID, PASSWORD, NAME, PR, ADDRESS, EMAIL, PHONE,
         BIRTH_YEAR, HEIGHT, WEIGHT, BLOOD_TYPE, RELIGION, HOBBY,
         MAIN_PHOTO_URL, GENDER, CERTS, CREATEBY,
         LATITUDE, LONGITUDE )
       VALUES
       ( :loginId, :password, :name, :pr, :address, :email, :phone,
         :birthYear, :height, :weight, :bloodType, :religion, :hobby,
         :mainPhotoUrl, :gender, :certs, :createby,
         :lat, :lng )
       RETURNING MEMBER_NO INTO :out_member_no`,
      {
        loginId: loginId || null,
        password: (password && password.trim() !== '') ? password : null,
        name: name || null,
        pr: pr || null,
        address: address || null,
        email: email || null,
        phone: phone || null,
        birthYear: toNum(birthYear),
        height: toNum(height),
        weight: toNum(weight),
        bloodType: bloodType || null,
        religion: religion || null,
        hobby: hobby || null,
        mainPhotoUrl: mainPhotoUrl || null,
        gender: (gender && String(gender).trim() !== '' ? String(gender).toUpperCase() : 'N'),
        certs: certs || null,
        createby: createby || null,
        lat: latNum,          // ⬅️ 그대로 바인딩
        lng: lngNum,          // ⬅️ 그대로 바인딩
        out_member_no: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 64 }
      },
      txOpts
    );

    const memberNo = Array.isArray(r1.outBinds.out_member_no)
      ? r1.outBinds.out_member_no[0]
      : r1.outBinds.out_member_no;

    // 2) 학력들 INSERT (있을 때만)
    let insertedEdu = 0;
    let eduArr = [];
    try { eduArr = JSON.parse(educations || '[]'); } catch (_) { }

    if (Array.isArray(eduArr) && eduArr.length > 0) {
      const sqlEdu = `
        INSERT INTO TBL_CMS_CUST_EDU
        ( EDU_ID, MEMBER_NO, EDU_LEVEL, SCHOOLNO, SCHOOLNAME, MAJOR, ENTER_YEAR, GRAD_YEAR, AREA )
        VALUES
        ( NULL, :memberNo, :eduLevel, NULL, :schoolName, :major, :enterYear, :gradYear, :area )
      `;
      const bindsEdu = eduArr.map(e => ({
        memberNo,
        eduLevel: e.level || null,
        schoolName: e.school || null,
        major: e.major || null,
        enterYear: toNum(e.enter),
        gradYear: toNum(e.graduate),
        area: e.area || null
      }));
      const r2 = await connection.executeMany(sqlEdu, bindsEdu, txOpts);
      insertedEdu = r2.rowsAffected || 0;
    }

    await connection.commit();
    res.json({ result: "success", memberNo, eduInserted: insertedEdu });
  } catch (err) {
    try { await connection.rollback(); } catch (_) { }
    console.error('customerinsert tx error', err);
    res.status(500).send('Error executing insert');
  }
});




// 고객 + 학력(1건) 동시 등록 (아주 단순 버전)
app.get('/cms/customerinsert2', async (req, res) => {
  // 프로필 기본 + 학력 1건만 받음
  const {
    name, phone, email, address, pr,
    birthYear, height, weight, gender,
    mainPhotoUrl,
    createBy,                // 직원ID -> CREATEBY 컬럼

    // 학력 1건
    eduLevel, schoolName, major, enterYear, gradYear, area
  } = req.query;

  const toNum = v => (v == null || v === '' ? null : Number(v));

  try {
    // 1) 고객 프로필 INSERT + 생성된 MEMBER_NO 회수
    const r1 = await connection.execute(
      `INSERT INTO TBL_CMS_CUST_PROFILE
       ( NAME, PHONE, EMAIL, ADDRESS, PR,
         BIRTH_YEAR, HEIGHT, WEIGHT, GENDER, MAIN_PHOTO_URL, CREATEBY )
       VALUES
       ( :name, :phone, :email, :address, :pr,
         :birthYear, :height, :weight, :gender, :mainPhotoUrl, :createBy )
       RETURNING MEMBER_NO INTO :memberNo`,
      {
        name: name || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        pr: pr || null,
        birthYear: toNum(birthYear),
        height: toNum(height),
        weight: toNum(weight),
        gender: (gender || 'N').toUpperCase(),
        mainPhotoUrl: mainPhotoUrl || null,
        createBy: createBy || null,
        memberNo: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 64 }
      },
      { autoCommit: false }   // 마지막에 한 번만 커밋
    );

    const memberNo = Array.isArray(r1.outBinds.memberNo)
      ? r1.outBinds.memberNo[0]
      : r1.outBinds.memberNo;

    // 2) 학력 1건 INSERT (값이 있으면)
    if (eduLevel || schoolName || major || enterYear || gradYear || area) {
      await connection.execute(
        `INSERT INTO TBL_CMS_CUST_EDU
         ( EDU_ID, MEMBER_NO, EDU_LEVEL, SCHOOLNO, SCHOOLNAME, MAJOR, ENTER_YEAR, GRAD_YEAR, AREA )
         VALUES
         ( NULL, :memberNo, :eduLevel, NULL, :schoolName, :major, :enterYear, :gradYear, :area )`,
        {
          memberNo,
          eduLevel: eduLevel || null,
          schoolName: schoolName || null,
          major: major || null,
          enterYear: toNum(enterYear),
          gradYear: toNum(gradYear),
          area: area || null
        },
        { autoCommit: false }
      );
    }

    await connection.commit();
    res.json({ result: 'success', memberNo });
  } catch (e) {
    try { await connection.rollback(); } catch (_) { }
    console.error('customerinsert2 error', e);
    res.status(500).send('Error executing insert');
  }
});







app.get('/cms/useridsearch', async (req, res) => {
  const { loginId } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM system_user WHERE LOGIN_ID = '${loginId}'`);
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






// 시스템 사용자 등록 복잡해서 주석처리
// app.get('/cms/userinsert', async (req, res) => {
//   let {
//     loginId,
//     password,
//     name,
//     email,
//     phone,
//     hiredAt,   
//     status,
//     note
//   } = req.query;

//   try {
//     // 필요 컬럼만 우선 삽입 (없는 컬럼은 주석처리 후 스키마에 맞게 추가)
//     let sql = `
//      INSERT INTO SYSTEM_USER
//      ( LOGIN_ID, PASSWORD, NAME, EMAIL, PHONE, HIRED_AT, STATUS, NOTE, CDATETIME, UDATETIME )
//       VALUES
//       ( :loginId, :password, :name, :email, :phone, TO_DATE(:hiredAt,'YYYY-MM-DD'), :status, :note, SYSDATE, SYSDATE )
//      `;
//     await connection.execute(
//       sql,
//       [
//         loginId || null,
//         (password && password.trim() !== '') ? password : null,
//         name || null,
//         email || null,
//         phone || null,
//         hiredAt || null,   
//         status || 'active',
//         note || null
//       ],
//       { autoCommit: true }
//     );

//     res.json({ result: 'success' });
//   } catch (error) {
//     console.error('Error executing insert', error);
//     res.status(500).send('Error executing insert');
//   }
// });



// 시스템 사용자 등록 - 학(최대한 단순)
app.get('/cms/userinsert', async (req, res) => {
  // 쿼리스트링 그대로 받기 (빈값 방지용 기본값만 살짝)
  let {
    loginId = '',
    password = '',
    name = '',
    email = '',
    phone = '',
    hiredAt = '',   // 'YYYY-MM-DD'로 보낸다고 가정
    status = 'active',
    note = ''
  } = req.query;

  // 학원식: 문자열로 SQL 바로 구성 (간단/직관)
  // HIRED_AT이 DATE 컬럼이면 TO_DATE 사용, 아니면 그냥 '${hiredAt}'
  const query =
    `INSERT INTO SYSTEM_USER
     (LOGIN_ID, PASSWORD, NAME, EMAIL, PHONE, HIRED_AT, STATUS, NOTE, CDATETIME, UDATETIME)
     VALUES
     ('${loginId}', '${password}', '${name}', '${email}', '${phone}',
      ${hiredAt ? `TO_DATE('${hiredAt}', 'YYYY-MM-DD')` : 'NULL'},
      '${status}', '${note}', SYSDATE, SYSDATE)`;

  try {
    await connection.execute(query, [], { autoCommit: true });
    res.json({ result: 'success' });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});




// 사용자 정보 수정 (업데이트)
app.get('/cms/userupdate', async (req, res) => {
  const { userId, name, email, phone, status, hiredAt, note } = req.query;

  console.log("수정 요청:", req.query);

  try {
    // hiredAt이 값이 있으면 DATE로 변환, 없으면 NULL 처리
    let hiredAtValue = hiredAt ? new Date(hiredAt) : null;

    await connection.execute(
      `UPDATE SYSTEM_USER 
          SET NAME = :name,
              EMAIL = :email,
              PHONE = :phone,
              STATUS = :status,
              HIRED_AT = :hiredAt,
              NOTE = :note
        WHERE LOGIN_ID = :userId`,
      [name, email, phone, status, hiredAtValue, note, userId],
      { autoCommit: true }
    );

    res.json({ result: "success" });

  } catch (error) {
    console.error('Error executing update', error);
    res.status(500).send('Error executing update');
  }
});




// 직원 status 조회 (active / inactive / left)
app.get('/cms/userstatus', async (req, res) => {
  const { loginId } = req.query;
  try {
    const result = await connection.execute(
      `SELECT STATUS FROM SYSTEM_USER WHERE LOGIN_ID = :id`,
      [loginId]
    );
    // rows 기본 포맷이 배열형이라 첫 컬럼만 뽑습니다.
    const status = (result.rows && result.rows.length > 0) ? result.rows[0][0] : null;

    // 프론트에서 쓰기 좋게 단순 JSON
    res.json({ status }); // e.g. { status: "active" }
  } catch (err) {
    console.error('Error executing userstatus', err);
    res.status(500).send('Error executing userstatus');
  }
});





// 학력 조회
app.get('/cms/customeredu', async (req, res) => {
  const { memberNo } = req.query;
  // console.log("/cms/customeredu진입 " + memberNo);
  if (!memberNo) return res.json({ result: "success", list: [] });

  try {
    const result = await connection.execute(
      `SELECT
          EDU_ID,
          MEMBER_NO,
          EDU_LEVEL,
          SCHOOLNO,
          SCHOOLNAME,
          MAJOR,
          ENTER_YEAR,
          GRAD_YEAR,
          AREA
       FROM TBL_CMS_CUST_EDU
       WHERE MEMBER_NO = :memberNo
       ORDER BY ENTER_YEAR DESC NULLS LAST, GRAD_YEAR DESC NULLS LAST, EDU_ID DESC`,
      [memberNo]
    );

    const cols = result.metaData.map(c => c.name);
    const rows = result.rows.map(r => {
      const o = {};
      cols.forEach((name, i) => { o[name] = r[i]; });
      return o;
    });

    res.json({ result: "success", list: rows });
    // 만약 프론트가 '배열'만 원하면 ↓로 바꿔도 됨
    // res.json(rows);
  } catch (err) {
    console.error('customeredu error:', err);
    res.status(500).send('Error executing query');
  }
});


// 1) 프로필 업데이트
// app.get('/cms/customerupdate', async (req, res) => {
//   const {
//     memberNo, name, pr, address, email, phone,
//     birthYear, height, weight, gender, mainPhotoUrl
//   } = req.query;

//   try {
//     // ⬇️ 필요 시 지오코딩
//     let lat = null, lng = null;
//     if (address) {
//       const g = await geocodeByNaver(address);
//       if (g) { lat = g.lat; lng = g.lng; }
//     }
//     await connection.execute(
//       `UPDATE TBL_CMS_CUST_PROFILE
//          SET NAME=:name, PR=:pr, ADDRESS=:address, EMAIL=:email, PHONE=:phone,
//              BIRTH_YEAR=:birthYear, HEIGHT=:height, WEIGHT=:weight,
//              GENDER=:gender, MAIN_PHOTO_URL=:mainPhotoUrl, UDATETIME=SYSDATE,
//              LATITUDE = NVL(:lat, LATITUDE),   -- 새 좌표가 있으면 교체
//              LONGITUDE = NVL(:lng, LONGITUDE)
//        WHERE MEMBER_NO=:memberNo`,
//       [
//         name || null, pr || null, address || null, email || null, phone || null,
//         birthYear ? Number(birthYear) : null, height ? Number(height) : null, weight ? Number(weight) : null,
//         (gender || 'N').toUpperCase(), mainPhotoUrl || null,
//         lat, lng,
//         memberNo
//       ],
//       { autoCommit: true }
//     );
//     res.json({ result: 'success' });
//   } catch (e) {
//     console.error(e);
//     res.status(500).send('Error executing update');
//   }
// });
// 숫자/빈값 보정 유틸 (파일에 이미 있으면 중복 정의하지 마세요)
function toNumOrNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().toLowerCase();
  if (s === '' || s === 'null' || s === 'undefined') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function toNullIfEmpty(v) {
  if (v === undefined || v === null) return null;
  const s = String(v);
  return s.trim() === '' ? null : v;
}

app.get('/cms/customerupdate', async (req, res) => {
  try {
    const q = req.query;
    console.log("q는 " + JSON.stringify(q));
    const binds = {
      memberNo: q.memberNo,
      name: toNullIfEmpty(q.name) ?? '',
      pr: toNullIfEmpty(q.pr),
      address: toNullIfEmpty(q.address),
      email: toNullIfEmpty(q.email),
      phone: toNullIfEmpty(q.phone),
      birthYear: toNumOrNull(q.birthYear),
      height: toNumOrNull(q.height),
      weight: toNumOrNull(q.weight),
      gender: (q.gender || 'N').toUpperCase(),
      mainPhotoUrl: toNullIfEmpty(q.mainPhotoUrl),
      lat: toNumOrNull(q.lat),   // 안 오면 NULL 저장
      lng: toNumOrNull(q.lng)    // 안 오면 NULL 저장
    };

    const sql = `
      UPDATE TBL_CMS_CUST_PROFILE
         SET NAME            = :name,
             PR              = :pr,
             ADDRESS         = :address,
             EMAIL           = :email,
             PHONE           = :phone,
             BIRTH_YEAR      = :birthYear,
             HEIGHT          = :height,
             WEIGHT          = :weight,
             GENDER          = :gender,
             MAIN_PHOTO_URL  = :mainPhotoUrl,
             LATITUDE        = :lat,
             LONGITUDE       = :lng,
             UDATETIME       = SYSDATE
       WHERE MEMBER_NO       = :memberNo
    `;

    const result = await connection.execute(
      sql,
      {
        memberNo: binds.memberNo,
        name: binds.name,
        pr: binds.pr,
        address: binds.address,
        email: binds.email,
        phone: binds.phone,
        birthYear: { val: binds.birthYear, type: oracledb.NUMBER },
        height: { val: binds.height, type: oracledb.NUMBER },
        weight: { val: binds.weight, type: oracledb.NUMBER },
        gender: binds.gender,
        mainPhotoUrl: binds.mainPhotoUrl,
        lat: { val: binds.lat, type: oracledb.NUMBER },
        lng: { val: binds.lng, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    res.json({ result: 'success', rowsAffected: result.rowsAffected });
  } catch (err) {
    console.error('customerupdate error', err);
    res.status(500).json({ result: 'error', message: String(err) });
  }
});




// 2) 학력은 전체를 갈아끼우기(전체 delete 후 insert)
app.get('/cms/customeredu/replace', async (req, res) => {
  const { memberNo, list } = req.query;
  if (!memberNo) return res.status(400).send('memberNo required');

  try {
    const rows = list ? JSON.parse(list) : [];
    await connection.execute(`DELETE FROM TBL_CMS_CUST_EDU WHERE MEMBER_NO=:m`, [memberNo]);

    for (const r of rows) {
      await connection.execute(
        `INSERT INTO TBL_CMS_CUST_EDU
          (EDU_ID, MEMBER_NO, EDU_LEVEL, SCHOOLNO, SCHOOLNAME, MAJOR, ENTER_YEAR, GRAD_YEAR, AREA)
         VALUES (NULL, :m, :lvl, NULL, :sch, :maj, :ent, :grd, :area)`,
        [
          memberNo,
          r.EDU_LEVEL || null,
          r.SCHOOLNAME || null,
          r.MAJOR || null,
          r.ENTER_YEAR || null,
          r.GRAD_YEAR || null,
          r.AREA || null
        ]
      );
    }
    await connection.commit();
    res.json({ result: 'success' });
  } catch (e) {
    try { await connection.rollback(); } catch (_) { }
    console.error(e);
    res.status(500).send('Error executing replace');
  }
});




//이미지 저장을 위해서 추가 250917-------------------------------S
// 업로드된 파일의 저장 위치 및 이름 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // 업로드 경로
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });


// 4. 이미지 업로드 라우터 추가
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send({
    message: 'Image uploaded successfully!',
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// 여기서 upload.single('image')에서 'image'는 <input type="file" name="image">의 name 속성과 일치해야 함

// 5. 정적 파일 서빙 설정 (이미지 접근 가능하게)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//이미지 저장을 위해서 추가 250917-------------------------------E




// POST 폼 파싱
app.use(express.urlencoded({ extended: true }));
// 주소API 결과 릴레이: POST -> 303 리다이렉트(GET)
app.post('/juso/return', (req, res) => {
  // JUSO가 보낸 모든 필드들을 쿼리스트링으로 변환
  const params = new URLSearchParams(req.body).toString();

  // 팝업용 정적 페이지로 이동(여기는 GET)
  // 5501 포트/경로는 본인 환경에 맞게
  const redirectUrl = `http://192.168.30.45:5501/client/jusoPopup.html?${params}`;

  // 브라우저에서 확실히 이동하도록 스크립트 반환
  res.status(200).send(`
    <!doctype html><meta charset="utf-8">
    <script>location.replace(${JSON.stringify(redirectUrl)});</script>
  `);
});









//250918 네이버지도관련------------------------------------------------------S

// server.js (일부분)
const axios = require('axios');

// .env 등 안전한 곳에 보관
// NCP_KEY_ID=<콘솔의 Client ID>
// NCP_KEY=<콘솔의 Client Secret>

async function geocodeByNaver(addr) {
  if (!addr) return null;
  const url = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode';

  const keyId = process.env.NCP_KEY_ID;
  const key = process.env.NCP_KEY;
  console.log("Naver KeyId:", keyId);
  console.log("Naver key:", key);
  const { data } = await axios.get(url, {

    params: { query: addr },
    headers: {

      'X-NCP-APIGW-API-KEY-ID': process.env.NCP_KEY_ID,
      'X-NCP-APIGW-API-KEY': process.env.NCP_KEY
    }
  });
  if (data.addresses && data.addresses.length) {
    const a = data.addresses[0];
    return { lat: parseFloat(a.y), lng: parseFloat(a.x) }; // y=위도, x=경도
  }
  return null;
}

//250918 네이버지도관련------------------------------------------------------E

//250918 타회원열람권 관련--------------------------------------------------S
// [열람권 확인] 이미 구매했고 아직 유효하면 allowed:true
app.get('/cms/access/check', async (req, res) => {
  const { viewerId = '', memberNo = '' } = req.query;
  try {
    const r = await connection.execute(
      `SELECT EXPIRE_AT
         FROM TBL_CMS_VIEWPASS
        WHERE VIEWER_ID = :viewer
          AND MEMBER_NO = :member
          AND EXPIRE_AT >= SYSDATE`,
      [viewerId, memberNo]
    );
    if (r.rows && r.rows.length) {
      return res.json({ allowed: true, expireAt: r.rows[0][0] });
    }
    res.json({ allowed: false });
  } catch (e) {
    console.error('access/check error', e);
    res.status(500).json({ allowed: false, message: 'check failed' });
  }
});

// [열람권 부여/연장] 결제 성공 후 3일로 세팅(이미 있으면 갱신)
app.get('/cms/access/grant', async (req, res) => {
  const { viewerId = '', memberNo = '', orderId = '', amount = 0, days = 3 } = req.query;
  try {
    const r = await connection.execute(
      `
      MERGE INTO TBL_CMS_VIEWPASS t
      USING (SELECT :viewerId AS VIEWER_ID, :memberNo AS MEMBER_NO FROM dual) s
         ON (t.VIEWER_ID = s.VIEWER_ID AND t.MEMBER_NO = s.MEMBER_NO)
      WHEN MATCHED THEN
        UPDATE SET
          ORDER_ID  = :orderId,
          AMOUNT    = :amount,
          PAID_AT   = SYSDATE,
          EXPIRE_AT = SYSDATE + :days,
          UDATETIME = SYSDATE
      WHEN NOT MATCHED THEN
        INSERT(VIEWER_ID, MEMBER_NO, ORDER_ID, AMOUNT, PAID_AT, EXPIRE_AT, CDATETIME, UDATETIME)
        VALUES(:viewerId, :memberNo, :orderId, :amount, SYSDATE, SYSDATE + :days, SYSDATE, SYSDATE)
      `,
      { viewerId, memberNo, orderId, amount: Number(amount) || 0, days: Number(days) || 3 },
      { autoCommit: true }
    );
    res.json({ ok: true, rowsAffected: r.rowsAffected || 0 });
  } catch (e) {
    console.error('access/grant error', e);
    res.status(500).json({ ok: false, message: 'grant failed' });
  }
});


// [내가 구매해서 아직 유효한 타회원 목록]
app.get('/cms/access/mylist', async (req, res) => {
  try {
    let { viewerId = '', pageSize = 10, offset = 0 } = req.query;
    pageSize = Number(pageSize) || 10;
    offset = Number(offset) || 0;

    // 총건수
    const countSql = `
      SELECT COUNT(*)
        FROM TBL_CMS_VIEWPASS v
        JOIN TBL_CMS_CUST_PROFILE p ON p.MEMBER_NO = v.MEMBER_NO
       WHERE v.VIEWER_ID = :viewerId
         AND v.EXPIRE_AT >= SYSDATE
    `;
    const c = await connection.execute(countSql, [viewerId]);
    const total = (c.rows && c.rows[0] && c.rows[0][0]) || 0;

    // 목록 (이름/사진 등 포함)
    const listSql = `
      SELECT
        p.MEMBER_NO,
        p.NAME,
        p.BIRTH_YEAR,
        p.HEIGHT,
        p.WEIGHT,
        p.GENDER,
        p.MAIN_PHOTO_URL,
        p.CREATEBY,
        TO_CHAR(v.EXPIRE_AT, 'YYYY-MM-DD HH24:MI:SS') AS EXPIRES_AT
      FROM TBL_CMS_VIEWPASS v
      JOIN TBL_CMS_CUST_PROFILE p ON p.MEMBER_NO = v.MEMBER_NO
      WHERE v.VIEWER_ID = :viewerId
        AND v.EXPIRE_AT >= SYSDATE
      ORDER BY v.EXPIRE_AT DESC, p.MEMBER_NO DESC
      OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
    `;
    const r = await connection.execute(
      listSql,
      { viewerId, offset, pageSize }
    );

    const cols = r.metaData.map(c => c.name);
    const rows = r.rows.map(row => {
      const o = {};
      cols.forEach((name, i) => o[name] = row[i]);
      return o;
    });

    res.json({ result: 'success', count: total, list: rows });
  } catch (e) {
    console.error('access/mylist error', e);
    res.status(500).json({ result: 'error', message: 'mylist failed' });
  }
});

//250918 타회원열람권 관련--------------------------------------------------E





// ====================== 장바구니 (아주 단순 버전) ======================

// 1) 담기: 이미 있으면 안 넣음 (한 번의 쿼리, MERGE 안씀)
app.get('/cms/cart/add', async (req, res) => {
  const { viewerId = '', memberNo = '' } = req.query;
  try {
    const r = await connection.execute(
      `
      INSERT INTO TBL_CMS_CART (VIEWER_ID, MEMBER_NO, CDATETIME, UDATETIME)
      SELECT :v, :m, SYSDATE, SYSDATE FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1 FROM TBL_CMS_CART
         WHERE VIEWER_ID = :v AND MEMBER_NO = :m
      )
      `,
      { v: viewerId, m: memberNo },
      { autoCommit: true }
    );
    // rowsAffected 가 1이면 새로 담긴 것, 0이면 이미 있었던 것
    res.json({ ok: true, added: !!(r.rowsAffected) });
  } catch (e) {
    console.error('cart/add error', e);
    res.status(500).json({ ok: false, message: 'add failed' });
  }
});

// 2) 빼기: 단순 삭제
app.get('/cms/cart/remove', async (req, res) => {
  const { viewerId = '', memberNo = '' } = req.query;
  try {
    const r = await connection.execute(
      `DELETE FROM TBL_CMS_CART WHERE VIEWER_ID = :v AND MEMBER_NO = :m`,
      { v: viewerId, m: memberNo },
      { autoCommit: true }
    );
    res.json({ ok: true, removed: r.rowsAffected > 0 });
  } catch (e) {
    console.error('cart/remove error', e);
    res.status(500).json({ ok: false, message: 'remove failed' });
  }
});

// 3) 존재여부: 아이콘/버튼 상태 표시용(선택)
app.get('/cms/cart/has', async (req, res) => {
  const { viewerId = '', memberNo = '' } = req.query;
  try {
    const r = await connection.execute(
      `SELECT 1 FROM TBL_CMS_CART WHERE VIEWER_ID=:v AND MEMBER_NO=:m`,
      { v: viewerId, m: memberNo }
    );
    res.json({ inCart: (r.rows && r.rows.length > 0) });
  } catch (e) {
    console.error('cart/has error', e);
    res.status(500).json({ inCart: false });
  }
});

// 4) 목록: 내 장바구니에 담긴 프로필만(아주 단순)
app.get('/cms/cart/list', async (req, res) => {
  let { viewerId = '', pageSize = 10, offset = 0 } = req.query;

  pageSize = Number(pageSize) || 10;
  offset = Number(offset) || 0;

  // 프로필과 조인해서 화면에 바로 쓸 수 있게 전달
  const listSql = `
    SELECT
      B.MEMBER_NO,
      '비공개' AS NAME,             -- ★ 이름은 항상 비공개로 내려보냄
      B.BIRTH_YEAR,
      B.HEIGHT,
      B.WEIGHT,
      B.GENDER,
      B.MAIN_PHOTO_URL,
      B.CREATEBY
    FROM TBL_CMS_CART C
    JOIN TBL_CMS_CUST_PROFILE B ON B.MEMBER_NO = C.MEMBER_NO
    WHERE C.VIEWER_ID = :v
    ORDER BY C.CDATETIME DESC
    OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
  `;

  const countSql = `
    SELECT COUNT(*) FROM TBL_CMS_CART WHERE VIEWER_ID = :v
  `;

  try {
    const cnt = await connection.execute(countSql, { v: viewerId });
    const total = (cnt.rows && cnt.rows[0] && cnt.rows[0][0]) || 0;

    const rs = await connection.execute(listSql, { v: viewerId });
    const cols = rs.metaData.map(c => c.name);
    const rows = rs.rows.map(r => {
      const o = {}; cols.forEach((c, i) => o[c] = r[i]); return o;
    });

    res.json({ result: 'success', count: total, list: rows });
  } catch (e) {
    console.error('cart/list error', e);
    res.status(500).json({ result: 'error', message: 'list failed' });
  }
});

// ==================== /장바구니 (아주 단순 버전) ====================








// 모든/자기 고객 좌표만 내려주는 초간단 API
app.get('/cms/coords', async (req, res) => {
  const { loginId = '', sStatus = '' } = req.query;
  const isAdmin = String(loginId).trim().toLowerCase() === 'admin';

  try {
    let sql, binds;
    if (isAdmin) {
      // admin: 전체 고객 좌표
      sql = `
        SELECT MEMBER_NO, NAME, GENDER, LATITUDE, LONGITUDE
          FROM TBL_CMS_CUST_PROFILE
         WHERE LATITUDE IS NOT NULL
           AND LONGITUDE IS NOT NULL
      `;
      binds = {};
    } else if (String(sStatus).trim() === 'active') {
      // 직원: 내가 작성한 고객만
      sql = `
        SELECT MEMBER_NO, NAME, GENDER, LATITUDE, LONGITUDE
          FROM TBL_CMS_CUST_PROFILE
         WHERE CREATEBY = :loginId
           AND LATITUDE IS NOT NULL
           AND LONGITUDE IS NOT NULL
      `;
      binds = { loginId };
    } else {
      // 고객(일반 사용자): 지도 숨김 → 빈 목록
      return res.json({ result: 'success', list: [] });
    }

    const r = await connection.execute(sql, binds);
    const cols = r.metaData.map(c => c.name);
    const rows = r.rows.map(row => {
      const o = {}; cols.forEach((n, i) => o[n] = row[i]); return o;
    });
    res.json({ result: 'success', list: rows });
  } catch (e) {
    console.error('coords error', e);
    res.status(500).json({ result: 'error', message: 'coords failed' });
  }
});






// ================== 고객 삭제 (작성자 본인만) =================S
app.get('/cms/customerdelete', async (req, res) => {
  const { memberNo = '', requestBy = '' } = req.query;

  if (!memberNo || !requestBy) {
    return res.status(400).json({ result: 'error', message: 'memberNo, requestBy required' });
  }

  const tx = { autoCommit: false };

  try {
    // 1) 소유자 확인
    const ownerRs = await connection.execute(
      `SELECT CREATEBY FROM TBL_CMS_CUST_PROFILE WHERE MEMBER_NO = :m`,
      { m: memberNo }
    );

    if (!ownerRs.rows || ownerRs.rows.length === 0) {
      return res.status(404).json({ result: 'error', message: 'not found' });
    }

    const ownerId = ownerRs.rows[0][0]; // 기본 배열 포맷: 첫 컬럼
    if (String(ownerId) !== String(requestBy)) {
      return res.status(403).json({ result: 'error', message: 'forbidden (not owner)' });
    }

    // 2) 자식(학력) 삭제 → 3) 프로필 삭제
    await connection.execute(
      `DELETE FROM TBL_CMS_CUST_EDU WHERE MEMBER_NO = :m`,
      { m: memberNo },
      tx
    );

    const delProfile = await connection.execute(
      `DELETE FROM TBL_CMS_CUST_PROFILE WHERE MEMBER_NO = :m`,
      { m: memberNo },
      tx
    );

    await connection.commit();

    return res.json({
      result: 'success',
      deletedEduRows: delProfile.rowsAffected, // 주: 이건 프로필 rowsAffected인데, 필요하면 별도 변수로 분리하세요
      deletedProfileRows: delProfile.rowsAffected
    });
  } catch (e) {
    try { await connection.rollback(); } catch (_) { }
    console.error('customerdelete error', e);
    return res.status(500).json({ result: 'error', message: 'delete failed' });
  }
});
// ================== 고객 삭제 (작성자 본인만) =================E




// ================== 직원 목록 (admin 전용) ==================
app.get('/cms/users', async (req, res) => {
  const { adminId = '', q = '', status = '' } = req.query;

  // 권한 체크
  if (String(adminId).toLowerCase() !== 'admin') {
    return res.status(403).json({ result: 'error', message: 'forbidden (admin only)' });
  }

  // 필터 구성(간단 문자열 방식, 네 스타일 유지)
  const kw = String(q || '').trim().toLowerCase().replace(/'/g, "''");
  const st = String(status || '').trim().toLowerCase();

  const wh = [];
  if (kw) {
    wh.push(`( LOWER(LOGIN_ID) LIKE '%${kw}%' OR LOWER(NAME) LIKE '%${kw}%' OR LOWER(EMAIL) LIKE '%${kw}%' )`);
  }
  if (st) {
    wh.push(`LOWER(STATUS) = '${st}'`);
  }
  const where = wh.length ? `WHERE ${wh.join(' AND ')}` : '';

  const sql = `
    SELECT LOGIN_ID, NAME, EMAIL, PHONE, STATUS,
           TO_CHAR(HIRED_AT, 'YYYY-MM-DD') AS HIRED_AT
      FROM SYSTEM_USER
      ${where}
      ORDER BY CASE WHEN LOGIN_ID='admin' THEN 0 ELSE 1 END, LOGIN_ID
  `;

  try {
    const r = await connection.execute(sql);
    const cols = r.metaData.map(c => c.name);
    const rows = r.rows.map(row => { const o = {}; cols.forEach((n, i) => o[n] = row[i]); return o; });
    res.json({ result: 'success', list: rows });
  } catch (e) {
    console.error('cms/users error', e);
    res.status(500).json({ result: 'error', message: 'list failed' });
  }
});

// ================== 직원 상태 변경 (admin 전용) ==================
app.get('/cms/user/setstatus', async (req, res) => {
  const { adminId = '', targetId = '', status = '' } = req.query;

  if (String(adminId).toLowerCase() !== 'admin') {
    return res.status(403).json({ result: 'error', message: 'forbidden (admin only)' });
  }
  if (!targetId || !status) {
    return res.status(400).json({ result: 'error', message: 'targetId, status required' });
  }

  const next = String(status).toLowerCase();
  if (!['active', 'inactive', 'left'].includes(next)) {
    return res.status(400).json({ result: 'error', message: 'invalid status' });
  }

  // admin 계정은 상태 변경 금지
  if (String(targetId).toLowerCase() === 'admin') {
    return res.status(400).json({ result: 'error', message: 'cannot change admin status' });
  }

  try {
    const r = await connection.execute(
      `UPDATE SYSTEM_USER SET STATUS=:st, UDATETIME=SYSDATE WHERE LOGIN_ID=:id`,
      { st: next, id: targetId },
      { autoCommit: true }
    );
    res.json({ result: 'success', rowsAffected: r.rowsAffected || 0 });
  } catch (e) {
    console.error('setstatus error', e);
    res.status(500).json({ result: 'error', message: 'update failed' });
  }
});














// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});
