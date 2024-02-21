var express = require('express');
const fs = require('fs');
const path = require("path");
const multer = require('multer');
const router = express.Router();
var db = require('../db.js');
var sql = require('../sql.js');

// 게시글 삭제
router.post('/delete', (req, res) => {
  const qnanum = req.body.qnano;

  db.query(sql.deleteContent, [qnanum], function (error, result) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'error' });
    } else {
      res.send(result);

    }
  })

});

// 게시글 수정
router.post('/edit', (req, res) => {
  const editQna = req.body;
  db.query(sql.qnaEdit, [editQna.content, editQna.title, editQna.qnapw, editQna.qnano], function (error, result) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'error' });
    } else {
      res.send(result);

    }
  })

});


// 답변 작성
router.post('/write_answer', (req, res) => {
  const writeQna = req.body;
  db.query(sql.qnaCommentWrite, [writeQna.qna_comment, writeQna.qna_no], function (error, result) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'error' });
    } else {
      res.send(result);

    }
  })

});

// qna 상세 내용 불러오기
router.post('/qnacontent', (req, res) => {
  const qnano = req.body.QNA_NO;

  db.query(sql.content, [qnano], function (error, result1) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'error' });
    } else {
      res.send(result1);


    }
  });
})

// qna 작성
router.post('/write', function (req, res) {
  const writeQna = req.body;
  console.log(writeQna);
  db.query(sql.write, [writeQna.user_no, writeQna.qna_title, writeQna.qna_content, writeQna.qna_pw, writeQna.qna_img, writeQna.goods_no], function (error, result) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'error' });
    } else {
      res.send(result);

    }
  })

});

// 상품 qna목록 불러오기
router.get('/goodsqnalist/:goodsno', (req, res) => {
  //const goods = req.body;
  const goodsno = req.params.goodsno
  console.log(goodsno);
  db.query(sql.qnaGoods, [goodsno], (err, result, fields) => {

    res.send(result);
  });
});

// 관리자 qna목록 불러오기
router.post('/qnalist', (req, res) => {

  db.query(sql.qnaAdmin, (err, result, fields) => {

    res.send(result);
  });
});

// 관리자 qna목록 불러오기
router.post('/qna_list', (req, res) => {
  const qnapage = req.body;
  const page = req.body.page || 1; 
  const offsetPage = 0 + (page - 1) * 10;
  db.query(sql.qna, [qnapage.pagesize, offsetPage], (err, result, fields) => {
    res.send(result);
  });
});

// 마이페이지 qna목록 불러오기
router.post('/myqna_list', (req, res) => {
  const user = req.body;
  const page = req.body.page || 1; 
  const offsetPage = 0 + (page - 1) * 10;

  db.query(sql.myqna, [user.userno, user.pagesize, offsetPage], function (error, result) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'error' });
    } else {
      res.send(result);

    }
  })

});

// 마이페이지 문의 리스트 
router.get('/myqna_list/:userno/:sortCase/:keyword/:page/:pagesize', function (request, response, next) {

  const userno = request.params.userno;
  const sortCase = request.params.sortCase;
  const pagesize =  parseInt(request.params.pagesize);
  const page = request.body.page || 1; 
  const offsetPage = 0 + (page - 1) * 10;
  const keyword = request.params.keyword;

  //console.log(userno, sortCase, keyword);
  let search = '';

  if (keyword != 'none') {
    search = ' and (qna_title Like "%' + keyword + '%" or user_name LIKE "%' + keyword + '%")';
  }

  const order = sortCaseReplace2(sortCase)
  db.query(sql.myqnalist + search + order, [userno, pagesize ,offsetPage], function (error, results, fields) {
    if (error) {
      console.error(error);
      return response.status(500).json({ error: '문의 리스트에러' });
    }
    response.json(results);
  });
});

function sortCaseReplace2(sortCase) {
  let order = ` AND qna_date >= date_add(now(),interval -1 year) ORDER BY qna_no DESC LIMIT ? OFFSET ?`; // 최근1년
  if (sortCase == 1) { // 일주일
    order = ` AND qna_date >= date_add(now(),interval -7 day) ORDER BY qna_no DESC LIMIT ? OFFSET ?`;
  }
  else if (sortCase == 2) { // 답변대기
    order = ` AND qna_comment IS NULL ORDER BY qna_no DESC LIMIT ? OFFSET ?`;
  }
  else if (sortCase == 3) { // 답변완료
    order = ` AND qna_comment IS NOT NULL ORDER BY qna_no DESC LIMIT ? OFFSET ?`;
  }
  return order;
}

//마이페이지 qna 글 불러오기
router.post('/boardlistcnt/:userno', (req, res) => {
  const userno = req.params.userno;
  db.query(sql.myqnacnt, [userno],(error, results, fields) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: '에러' });
    }
    return res.status(200).json(results[0]['COUNT(*)']);
  });
});

//admin qna 글 불러오기
router.post('/boardlistcnt', (req, res) => {
  db.query(sql.qnacnt,(error, results, fields) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: '에러' });
    }
    return res.status(200).json(results[0]['COUNT(*)']);
  });
});

//goods qna 글 갯수 불러오기
router.post('/qnalistcnt', (req, res) => {
  
  const goods = req.body;
  db.query(sql.qnacnt, [goods.goods_no], (error, results, fields) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: '에러' });
    }
    return res.status(200).json(results[0]['COUNT(*)']);
  });
});

// 관리자 문의 리스트 
router.get('/admin/qnalist/:sortCase/:keyword/:page/:pagesize', function (request, response, next) {

  const sortCase = request.params.sortCase;
  const pagesize =  parseInt(request.params.pagesize);
  const page = request.body.page || 1; 
  const offsetPage = 0 + (page - 1) * 10;
  const keyword = request.params.keyword;
  let search = '';

  if (keyword != 'none') {
    search = ' and (qna_title Like "%' + keyword + '%" or user_name LIKE "%' + keyword + '%")';
  }

  const order = sortCaseReplace(sortCase)
  db.query(sql.qnalist + search + order, [pagesize ,offsetPage], function (error, results, fields) {
    if (error) {
      console.error(error);
      return response.status(500).json({ error: '문의 리스트에러' });
    }
    response.json(results);
  });
});

function sortCaseReplace(sortCase) {
  let order = ` ORDER BY qna_no DESC LIMIT ? OFFSET ?`; // 최근 순
  if (sortCase == 1) { // 오래된 순
    order = ` ORDER BY qna_no LIMIT ? OFFSET ?`;
  }
  else if (sortCase == 2) { // 답변 완료
    order = ` AND qna_comment IS NOT NULL ORDER BY qna_no DESC LIMIT ? OFFSET ?`;
  }
  else if (sortCase == 3) { // 미답변
    order = ` AND qna_comment IS NULL ORDER BY qna_no LIMIT ? OFFSET ?`;
  }
  return order;
}

// 이미지 업로더 
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/uploadQna');
    },
    filename(req, file, cb) {
      cb(null, file.originalname);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 이미지 업로드
router.post('/upload', upload.single('upload'), function (request, response) {
  if (!request.file) {
    return response.status(404).json({ error: '이미지 업로드를 해주세요.' });
  }
  const imagePath = request.file.path
  console.log(imagePath)
  return response.json({ imagePath: imagePath })
})

module.exports = router;