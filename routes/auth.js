const express = require('express');
const router = express.Router();
const db = require('../db.js');
const sql = require('../sql.js');
const bcrypt = require('bcrypt');

//로그인
router.post('/login_process', function (request, response) {
    const loginUser = request.body;
    console.log(loginUser);
    db.query(sql.id_check, [loginUser.user_id], function (error, results, fields) {
        if (results.length <= 0) {
            return response.status(200).json({
                message: 'undefined_id'
            })
        }
        else {
            db.query(sql.login, [loginUser.user_id], function (error, results, fields) {
                //const same = loginUser.user_pw==results[0].user_pw;
                const same = bcrypt.compareSync(loginUser.user_pw, results[0].user_pw);

                if (same) {
                    // ID에 저장된 pw 값과 입력한 pw값이 동일한 경우
                    db.query(sql.get_user_no, [loginUser.user_id], function (error, results, fields) {
                        return response.status(200).json({
                            message: results[0].user_no
                        })
                    })
                }
                else {
                    // 비밀번호 불일치
                    return response.status(200).json({
                        message: 'incorrect_pw'
                    })
                }
            })
        }
    })
})

// 카카오 회원가입
router.post('/kakaoJoinProcess', function (request, response) {
    const kakao = request.body;

    // 데이터 없을 시 가입
    db.query(sql.kakao_check, [kakao.user_id], function (error, results, fields) {
        if (results.length <= 0) {
            db.query(sql.kakaoJoin, [kakao.user_id, kakao.user_name, kakao.user_id], function (error, result) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                } else {
                    return response.status(200).json({
                        message: '저장완료'
                    })
                }
            })
        }
        // 데이터 있으면 로그인 화면으로 이동
        else {
            return response.status(200).json({
                message: 'already_exist_id'
            })
        }
    })
})

// 카카오 로그인
router.post('/kakaoLoginProcess', function (request, response) {
    const kakao = request.body;
    console.log(kakao);
    // 데이터 없을 시 회원가입도 진행
    db.query(sql.kakao_check, [kakao.user_id], function (error, results, fields) {
        if (results.length <= 0) {
            db.query(sql.kakaoJoin, [kakao.user_id, kakao.user_name, kakao.user_id], function (error, result) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                }
            })
        }
        // 로그인 
        db.query(sql.get_user_no, [kakao.user_id], function (error, results, fields) {
            if (error) {
                console.log(error)
            }
            return response.status(200).json({
                message: results[0].user_no
            })
        })
    })
})

// 네이버 로그인
router.post('/naverlogin', function (request, response) {
    const naverlogin = request.body.naverlogin;

    //네이버 중복 로그인 방지
    db.query(sql.naver_id_check, [naverlogin.id], function (error, results, fields) {
        if (error) {
            console.log(error);
            return response.status(500).json({
                message: 'DB_error'
            });
        }
        if (results.length > 0) {
            // 가입된 계정 존재 
            db.query(sql.get_user_no, [naverlogin.id], function (error, results, fields) {
                if (error) {
                    console.log(error)
                }
                return response.status(200).json({
                    message: results[0].user_no
                })
            })
        } else {
            // DB에 계정 정보 입력 
            db.query(sql.naverlogin, [naverlogin.email, naverlogin.id, naverlogin.nickname, null], function (error, result) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                } else {
                    return response.status(200).json({
                        message: '저장완료'
                    })
                }
            })
        }
    })
})


// 회원가입
router.post('/join_process', function (request, response) {

    const user = request.body;
    console.log(user);
    const encryptedPW = bcrypt.hashSync(user.user_pw, 10); // 비밀번호 암호화
    console.log(encryptedPW);

    db.query(sql.id_check, [user.user_id], function (error, results, fields) {
        if (results.length <= 0) {
            db.query(sql.join, [user.user_name, user.user_id, encryptedPW, user.user_email, user.user_birth, user.user_phone, user.user_zipcode, user.user_adr1, user.user_adr2], function (error, data) {
                if (error) {
                    return response.status(500).json({
                        message: 'DB_error'
                    })
                }
                return response.status(200).json({
                    message: 'join_complete'
                });
            })
        }
        else {
            return response.status(200).json({
                message: 'already_exist_id'
            })
        }
    })
})

//id 확인
router.post('/id_check', function (request, response) {

    const user = request.body;
    console.log(user);

    db.query(sql.id_check, [user.user_id], function (error, results, fields) {
        if (results.length <= 0) {

            if (error) {
                return response.status(500).json({
                    message: 'DB_error'
                })
            }
            return response.status(200).json({
                message: 'use_id'
            });

        }
        else {
            return response.status(200).json({
                message: 'already_exist_id'
            })
        }
    })
})

//휴대폰 번호 확인
router.post('/phone_check', function (request, response) {

    const user = request.body;
    console.log(user);


    db.query(sql.phone_check, [user.user_phone], function (error, results, fields) {
        if (results.length <= 0) {

            if (error) {
                return response.status(500).json({
                    message: 'DB_error'
                })
            }
            return response.status(200).json({
                message: 'use_phone'
            });

        }
        else {
            return response.status(200).json({
                message: 'already_exist_phone'
            })
        }
    })
})

//아이디 찾기
router.post('/findId', function (request, response) {
    const user_name = request.body.user_name
    const user_email = request.body.user_email
    const user_phone = request.body.user_phone

    console.log(user_email);
    console.log(user_name);
    console.log(user_phone);

    db.query(sql.id_find, [user_name, user_email, user_phone], function (error, result, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러 발생' })
        }
        if (result.length === 0) {
            // 작성한 데이터가 db에 없을 경우
            return response.status(404).json({ message: '유저를 찾을 수 없음' });
        }

        const user_id = result[0].USER_ID; //아이디 가져오는 로직
        console.log(result[0]);
        return response.status(200).json({
            message: 'user_email',
            user_id: user_id
        });
    });
});

//ID 확인
router.get('/idcheck/:user_id', function (request, response) {

    const user = request.body;
    console.log(user);


    db.query(sql.id_check, [user.user_id], function (error, results, fields) {
        if (results.length > 0) {
            return response.status(200).json({
                message: 'already_exist_id'
            })
        }
    })
})

// 랜덤 비밀번호 설정 코드
function generateTempPassword() {
    const length = 6; // 임시 비밀번호의 길이
    const characters = '0123456789';
    let tempPassword = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        tempPassword += characters[randomIndex];
    }

    return tempPassword;
}

// 비번 찾기
router.post('/findPW', function (request, response) {
    const user_name = request.body.user_name
    const user_id = request.body.user_id
    const user_email = request.body.user_email
    const user_phone = request.body.user_phone

    db.query(sql.pw_find, [user_name, user_id, user_email, user_phone], async function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원 에러' });
        }

        if (results.length == 0) {
            // 정보가 데이터베이스에 존재하지 않는 경우
            return response.status(404).json({ message: 'user_not_found' });
        }

        const user_pw = generateTempPassword(); // 임시 비밀번호 생성

        const encryptedPW = bcrypt.hashSync(user_pw, 10); // 임시 비밀번호 암호화

        //업데이트
        db.query(sql.pw_uprandom, [encryptedPW, user_id], function (error) {
            if (error) {
                console.error(error);
                return response.status(500).json({ error: '비번 에러' });
            }
            return response.status(200).json({
                message: user_pw
            });
        });

    });
});

// 관리자 체크 
router.post('/admin_check', function (request, response) {
    const loginUser = request.body;

    db.query(sql.admin_check, [loginUser.user_no], function (error, results, fields) {
        if (results[0].user_type == 1) {
            // 로그인한 유저의 TYPE이 1(관리자)인 경우
            return response.status(200).json({
                message: 'admin'
            })
        }
        else {
            return response.status(200).json({
                message: 'user'
            })
        }
    })
})

// 회원리스트
// router.get('/admin/userlist/:keyword', function (request, response, next) {

//     const keyword = request.params.keyword;
//     let search = '';

//     if (keyword != 'none') {
//         search = ' AND user_email Like "%' + keyword + '%" ';
//     } 

//     db.query(sql.userlist + search, function (error, results, fields) {
//         if (error) {
//             console.error(error);
//             return response.status(500).json({ error: '회원리스트에러' });
//         }
//         response.json(results);
//     });
// });

// 회원 정렬 방식 
function sortCaseReplace(sortCase) {
    let order = ` ORDER BY user_no DESC LIMIT ? OFFSET ?`; // 최근 순

    if (sortCase == 1) { // 오래된 순
        order = ` ORDER BY user_no LIMIT ? OFFSET ?`;
    }
    else if (sortCase == 2) { //Local 
        order = ` AND user_social_type = 0 ORDER BY user_no DESC LIMIT ? OFFSET ?`;
    }
    else if (sortCase == 3) { // Kakao
        order = ` AND user_social_type = 1 ORDER BY user_no DESC LIMIT ? OFFSET ?`;
    }
    else if (sortCase == 4) {  // Naver
        order = ` AND user_social_type = 2 ORDER BY user_no DESC LIMIT ? OFFSET ?`;
    }
    return order;
}

// 관리자 회원목록 불러오기
router.post('/admin/user_list', (req, res) => {
    const userpage = req.body;
    const page = req.body.page || 1;
    const offsetPage = 0 + (page - 1) * 10;
    db.query(sql.userlist2, [userpage.pagesize, offsetPage], (err, result, fields) => {
        res.send(result);
    });
});

router.post('/boardlistcnt', (req, res) => {
    db.query(sql.usercnt, (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: '에러' });
        }
        return res.status(200).json(results[0]['COUNT(*)']);
    });
});

// 관리자 회원 정렬 
router.get('/admin/userlist/:keyword', function (request, response, next) {

    const keyword = request.params.keyword;
    let search = '';

    if (keyword != 'none') {
        search = ' AND user_email Like "%' + keyword + '%" ';
    } 

    db.query(sql.userlist + search, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원리스트에러' });
        }
        response.json(results);
    });
});

// 관리자 회원 검색 리스트 
router.get('/admin/userlist/:sortCase/:keyword/:page/:pagesize', function (request, response, next) {

    const page = request.body.page || 1;
    const pagesize =  parseInt(request.params.pagesize);
    const offsetPage = 0 + (page - 1) * 10;
    const sortCase = request.params.sortCase;
    const keyword = request.params.keyword;

    let search = '';

    if (keyword != 'none') {
        search = ' and (user_name Like "%' + keyword + '%" or user_id Like "%' + keyword + '%") ';
    }

    const order = sortCaseReplace(sortCase);

    db.query(sql.userlist + search + order, [pagesize, offsetPage], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원 리스트에러' });
        }
        response.json(results);
    });
});

// 회원 삭제
router.delete('/admin/userlist/:user_no', function (request, response, next) {
    const userNo = request.params.user_no;

    db.query(sql.deleteUser, [userNo], function (error, result, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원삭제에러' });
        }
        return response.status(200).json({ message: '회원삭제성공' });
    });
});


//이벤트 정답 o
router.post('/event_o', function (request, response) {

    const user = request.body;
    console.log(user);

    db.query(sql.event_o, [user.user_doevent, user.user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원리스트에러' });
        }
        response.json(results);
    })
})

//이벤트 정답x
router.post('/event_x', function (request, response) {

    const user = request.body;
    console.log(user);

    db.query(sql.event_x, [user.user_doevent, user.user_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '회원리스트에러' });
        }
        response.json(results);
    })
})

//유저 정보
router.get('/userNo/:user_no',  async (req, res ) => {
    const userNo = req.params.user_no;

    db.query(sql.get_user_info, [userNo], function (error, result, fields) {
        if (error) {
            console.error(error);
            return res.status(500).json({error: '유저 정보 조회 에러'});
        }

        const {user_name, user_email, user_phone} = result[0];
        return res.json({userName: user_name, userEmail: user_email, userPhone: user_phone})
    });
})
//배송지 추가
router.post('/addDeli', async (req, res) => {
    const addDeli = req.body;

    try {
        // 첫 번째 쿼리 실행
        const [insertResult] = await db.promise().query(sql.orderDeli, [
            addDeli.ordersNo, 
            addDeli.deliName, 
            addDeli.deliPhone, 
            addDeli.deliZipcode, 
            addDeli.deliAdr1, 
            addDeli.deliAdr2, 
            addDeli.deliMemo, 
            addDeli.user_no
        ]);

        // 삽입된 deli 레코드의 ID를 가져옵니다.
        const deli_no = insertResult.insertId;

        // 결과를 로깅하고 응답을 전송
        res.status(200).json({
            message: 'complete',
            deli_no: deli_no
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: '유저 정보 조회 에러'});
    }
});
//찜목록에서 장바구니로
router.post('/like_addCart', function (request, response) {
    const likeCart = request.body;
    const userNo = request.query.userNo;
    console.log(likeCart);
    console.log(userNo);

    db.query(sql.like_addCart, [userNo, likeCart.goodsNo], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({error:error.message, userNo, likeCart});
        }
        response.json(results);
    })
})


module.exports = router;