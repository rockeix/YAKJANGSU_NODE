var express = require('express');
const router = express.Router();
var db = require('../db.js');
var sql = require('../sql.js');
const fs = require('fs');
const path = require("path");
const multer = require('multer');
const bcrypt = require('bcrypt');

// 마이페이지
router.get('/mypage/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.get_user_info, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

//마이페이지 상단 주문정보
router.get('/orderbox/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.get_order_box, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

//마이페이지 상단 배송정보
router.get('/delibox/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.get_deli_box, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
});

//회원탈퇴
router.delete('/mypage/:user_no', function (request, response, next) {
    const userNo = request.params.user_no;

    db.query(sql.deleteAccount, [userNo], function (error, result, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '탈퇴에러' });
        }
        return response.status(200).json({ message: '탈퇴성공' });
    });
});


// 마이페이지 배송 중 개수 (추가)
router.post('/deliveryCount/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.get_delivery_count, [user_no], function (error, results, fields) {
        if (error) {
            return response.status(500).json({ error: '에러' });
        }
        response.json(results[0].cnt);
    });
});

// 비밀번호 변경
router.post('/pass_process', function (request, response) {
    const pass = request.body;

    db.query(sql.get_password, [pass.user_no], function (error, results, fields) {
        if (results.length <= 0) {
            if (error) {
                return response.status(500).json({
                    message: 'DB_error'
                });
            }
        } else {
            const same = bcrypt.compareSync(pass.user_pw, results[0].user_pw);

            if (!same) {    // 비밀번호 체크
                return response.status(200).json({
                    message: 'pw_ck'
                });
            }
            const encryptedNewPW = bcrypt.hashSync(pass.user_npw, 10); // 새 비밀번호 암호화

            db.query(sql.pass_update, [encryptedNewPW, pass.user_no], function (error, results, fields) {
                if (error) {
                    return response.status(500).json({
                        message: 'DB_error'
                    });
                }

                return response.status(200).json({
                    message: 'pass_update'
                });
            });
        }
    });
});

// 정보 수정
router.post('/mypageupdate', function (request, response, next) {
    const user = request.body;

    db.query(sql.mypage_update, [user.user_id, user.user_email, user.user_birth, user.user_phone, user.user_zipcode, user.user_adr1, user.user_adr2, user.user_no], function (error, result, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'mypage_update_error' });
        }
        return response.status(200).json({ message: 'mypage_update' });
    });
});

// 정보
router.get('/getUserData', function (request, response, next) {
    const user_no = request.query.user_no;

    db.query(sql.user_info, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '정보에러' });
        }
        response.json(results);
    });
});

// 비밀번호 변경
router.post('/pass_process', function (request, response) {
    const pass = request.body;

    db.query(sql.get_password, [pass.user_no], function (error, results, fields) {
        if (results.length <= 0) {
            if (error) {
                return response.status(500).json({
                    message: 'DB_error'
                });
            }
        } else {
            const same = bcrypt.compareSync(pass.user_pw, results[0].user_pw);

            if (!same) {    // 비밀번호 체크
                return response.status(200).json({
                    message: 'pw_ck'
                });
            }
            const encryptedNewPW = bcrypt.hashSync(pass.user_npw, 10); // 새 비밀번호 암호화

            db.query(sql.pass_update, [encryptedNewPW, pass.user_no], function (error, results, fields) {
                if (error) {
                    return response.status(500).json({
                        message: 'DB_error'
                    });
                }

                return response.status(200).json({
                    message: 'pass_update'
                });
            });
        }
    });
});

// 찜 리스트
router.post('/likeList/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.like_list, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json(results);
    });
});

// 리뷰 불러오기
router.get('/getMyReview/:order_no', function (request, response, next) {
    const order_no = request.params.order_no;

    db.query(sql.get_my_review, [order_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
})

// 리뷰 불러오기
router.get('/getMyReview2/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.get_my_review2, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
})

router.get('/getMyReview3/:review_no', function (request, response, next) {
    const review_no = request.params.review_no;

    db.query(sql.get_my_review_to, [review_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        response.json(results);
    });
})

// 리뷰 쓰기
router.post('/reviewWrite', function (request, response, next) {
    //const review = request.body;
    const {review_con, review_img, review_score, user_no, goods_no, orders_no, orders_status } = request.body;
    const values = [review_con, review_img, review_score, user_no, goods_no, orders_no, orders_status]
    console.log(request.body)

    db.query(sql.review_write, values, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원에러' });
        }
        //console.log(results,"results")
        else{
            //response.json(results);
            db.query(sql.check_review, [orders_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                }
            })
        
            return response.status(200).json({
                message: 'review_complete'
            });
        }
        
    });

})

// 이미지 업로더 
const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/uploadReview');
        },
        filename(req, file, cb) {
            cb(null, file.originalname);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// 이미지 업로드
router.post('/upload', upload.single('upload'), function(request, response) {
    if(!request.file) {
        return response.status(404).json({ error: '이미지 업로드를 해주세요.'});
    }
    const imagePath = request.file.path
    console.log(imagePath)
    return response.json({ imagePath: imagePath})
}) 

module.exports = router;


// router.get('/reviewDetail/:reviewno/:user_no', function (request, response, next) {
//     const user_no = request.params.user_no;
//     const review_no = request.params.reviewno;

//     db.query(sql.get_my_review_detail2, [user_no, review_no], function (error, results, fields) {
//         if (error) {
//             console.error(error);
//             return response.status(500).json({ error: '회원에러' });
//         }
//         response.json(results);
//     });
// })

// 리뷰 제거
router.post('/reviewDelete/:reviewno/:orders_no', function (request, response, next) {
    //const user_no = request.params.user_no;
    const review_no = request.params.reviewno;
    const orders_no = request.params.orders_no;
    console.log(orders_no);

    db.query(sql.review_delete, [review_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        else{
            db.query(sql.check_review2, [orders_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                }
            })
            return response.status(200).json({ message: 'complete' });
        }
        //return response.status(200).json({ message: 'complete' });
    });
});


router.post('/reviewEdit', (req, res) => {
    const editReview = req.body;
    db.query(sql.reviewEdit, [editReview.review_con, editReview.review_score, editReview.review_no], function (error, result) {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'error' });
      } else {
        res.send(result);
  
      }
    })
  
  });

  router.post('/calPoint/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;

    db.query(sql.calPoint, [user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        response.json(results);
        console.log(results);
    });
})

module.exports = router;