const express = require('express');
const router = express.Router();
const db = require('../db.js');
const sql = require('../sql.js');
const fs = require('fs');

const multer = require('multer');
const path = require("path");

// 메인 상품 리스트 
router.get('/maingoods', function (request, response, next) {
    db.query(sql.goods_list_best, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        response.json(results);
    });
});

// 상품 등록
router.post('/add_goods', function (request, response) {
    const goods = request.body;
    console.log(goods);

    try {
        // 동일 상품 존재하는지 조회
        db.query(sql.goods_check, [goods.goods_name], function (error, results, fields) {
            if (results.length <= 0) {

                // 이미지를 제외한 굿즈 정보 먼저 입력
                db.query(sql.goods_add, [goods.goods_name, goods.goods_category, goods.goods_price, goods.goods_tag1, goods.goods_tag2, goods.goods_tag3, goods.goods_cnt, goods.goods_img, goods.goods_content], function (error, results, fields) {
                    if (error) {
                        return response.status(200).json({
                            message: 'fail'
                        })
                    }
                    try {
                        const pastDir0 = `${__dirname}` + `../../uploads/` + goods.goods_img
                        const pastDir1 = `${__dirname}` + `../../uploads/` + goods.goods_content

                        const newDir = `${__dirname}` + `../../uploads/uploadGoods/`;
                        if (!fs.existsSync(newDir)) fs.mkdirSync(newDir);

                        const extension = goods.goods_img.substring(goods.goods_img.lastIndexOf('.'))

                        // 등록 상품의 번호 불러오기
                        db.query(sql.get_goods_no, [goods.goods_name], function (error, results, fields) {
                            const filename = results[0].goods_no

                            // 이미지 폴더 및 이름(상품번호-타입) 변경
                            // 타입 0: 메인 이미지 1: 상세 이미지
                            fs.rename(pastDir0, newDir + filename + '-0' + extension, (err) => {
                                if (err) {
                                    throw err;
                                }
                            });
                            fs.rename(pastDir1, newDir + filename + '-1' + extension, (err) => {
                                if (err) {
                                    throw err;
                                }
                            });

                            // 파일 변경 모두 성공했으면 바뀐 이름으로 DB에 입력 
                            db.query(sql.add_image, [filename + '-0' + extension, filename + '-1' + extension, filename], function (error, results, fields) {
                                if (error) {
                                    throw error;
                                }
                                else {
                                    return response.status(200).json({
                                        message: 'add_complete'
                                    })
                                }
                            })

                        })

                    }
                    catch (err) {
                        // 이미지 등록 실패
                        // -> DB에서 미리 등록한 상품도 다시 제거하기
                        db.query(sql.delete_goods, [goods.goods_name], function (error, results, fields) {
                            return response.status(200).json({
                                message: 'fail'
                            })
                        })
                    }
                })

            }
            else {
                return response.status(200).json({
                    message: 'already_exist_goods'
                })
            }
        })

    } catch {
        return response.status(200).json({
            message: 'DB_error'
        })
    }
})

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            cb(null, file.originalname);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// 이미지 등록 
router.post('/upload_img', upload.single('img'), (request, response) => {
    setTimeout(() => {
        return response.status(200).json({
            message: 'success'
        })
    }, 2000);
})

// 이미지 제거
router.post('/delete_img', (request, response) => {

    const pastname = request.body.pastname;
    try {
        if (pastname != "" && fs.existsSync(path.normalize(`${__dirname}../../uploads/${pastname}`))) {
            fs.unlinkSync(path.normalize(`${__dirname}../../uploads/${pastname}`))
        }
    }
    catch (error) {
        console.log(error)
    }
})

// 상품 목록 불러오기
const pageSize = 10; // 페이지당 상품 수

router.post('/admin/goods_list', (req, res) => {
    const page = req.body.page || 1;
    const offsetPage = 0 + (page - 1) * pageSize;
    db.query(sql.goods_list2, [pageSize, offsetPage], (err, result, fields) => {
        if (err) {
            // 에러 처리
            console.log(err);
            res.status(500).send('Server Error');
        } else {
            res.send(result);
        }
    });
});


// 상품 목록 갯수 불러오기
router.post('/boardlistcnt', (req, res) => {
    db.query(sql.goodscnt, (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: '에러' });
        }
        return res.status(200).json(results[0]['COUNT(*)']);
    });
});

// 상품 정렬 방식 
function sortCaseReplace(sortCase) {
    let order = ` ORDER BY goods_no DESC`; // 최근 순
    if (sortCase == 1) { // 오래된 순
        order = ` ORDER BY goods_no`;
    }
    else if (sortCase == 2) { // 낮은 가격 
        order = ` ORDER BY goods_price`;
    }
    else if (sortCase == 3) { // 높은 가격 
        order = ` ORDER BY goods_price DESC`;
    }
    else if (sortCase == 4) {  // 이름
        order = ` ORDER BY goods_name`;
    }
    return order;
}


//관리자페이지 상품 정렬 방식 
function sortCaseReplace2(sortCase) {
    let order = ` ORDER BY goods_no DESC LIMIT ? OFFSET ?`; // 최근 순
    if (sortCase == 1) { // 오래된 순
        order = ` ORDER BY goods_no LIMIT ? OFFSET ?`;
    }
    else if (sortCase == 2) { // 낮은 가격 
        order = ` ORDER BY goods_price LIMIT ? OFFSET ?`;
    }
    else if (sortCase == 3) { // 높은 가격 
        order = ` ORDER BY goods_price DESC LIMIT ? OFFSET ?`;
    }
    else if (sortCase == 4) {  // 이름
        order = ` ORDER BY goods_name LIMIT ? OFFSET ?`;
    }
    return order;
}

// 관리자 상품 리스트 
router.get('/admin/goodslist/:sortCase/:keyword/:page/:pagesize', function (request, response, next) {

    const sortCase = request.params.sortCase;
    const keyword = request.params.keyword;
    const pagesize =  parseInt(request.params.pagesize);
    const page = request.body.page || 1; 
    const offsetPage = 0 + (page - 1) * 10;

    let search = '';

    if (keyword != 'none') {
        search = ' WHERE goods_name Like "%' + keyword + '%" or goods_tag1 Like "%' + keyword + '%" or goods_tag2 Like "%' + keyword + '%" or goods_tag3 Like "%' + keyword + '%"';
    }

    const order = sortCaseReplace2(sortCase);

    db.query(sql.goods_list + search + order, [pagesize ,offsetPage], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품리스트에러' });
        }
        response.json(results);
    });
});

// 상품 수정용 정보 가져오기
router.post('/admin/get_goods_info', function (request, response, next) {
    const goods_no = request.body.goodsno
    db.query(sql.get_goods_info, [goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'goods_info_error' })
        }
        response.json(results);
    })
})

// 상품 수정
router.post('/update_goods', function (request, response, next) {
    const goods = request.body.goods

    db.query(sql.update_goods, [goods.goods_name, goods.goods_category, goods.goods_price, goods.goods_tag1, goods.goods_tag2, goods.goods_tag3, goods.goods_cnt, goods.goods_no], function(error, results, fields) {
        if (error) {
            console.log(error);
            return response.status(500).json({ error: 'goods_update_error' })
        }
        else {
            return response.status(200).json({ message: 'update_complete' })
        }
    })
})

// 상품 제거
router.post('/admin/delete_goods', function (request, response, next) {
    const goods_no = request.body.goods_no;

    // 이미지 이름 불러오기
    db.query(sql.get_img_nm, [goods_no], function (error, results, fields) {
        if (error) {
            return response.status(500).json({ error: 'goods_error' })
        }
        else {
            try {
                const goods_img = results[0].goods_img;
                const goods_content = results[0].goods_content;

                // 이미지 제거
                fs.unlinkSync(`${__dirname}../../uploads/uploadGoods/${goods_img}`);
                fs.unlinkSync(`${__dirname}../../uploads/uploadGoods/${goods_content}`);

                // 상품 제거
                db.query(sql.delete_goods_2, [goods_no], function (error, results, fields) {
                    if (error) {
                        return response.status(500).json({ error: 'goods_error' })
                    }
                    else {
                        return response.status(200).json({
                            message: 'delete_complete'
                        })
                    }
                })
            }
            catch (error) {
                console.log("에러");
            }
        }
    })
})

// Main_카테고리별 상품 리스트 
router.get('/goodsCate/:category/:sortCase', function (request, response, next) {
    const category = request.params.category;
    const sortCase = request.params.sortCase;

    const order = sortCaseReplace(sortCase);

    db.query(sql.goods_catelist + order, [category], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품카테고리리스트에러' });
        }
        response.json(results);
    });
});

// Main_상품 검색 리스트
router.get('/goodsSearch/:keyword/:sortCase', function (request, response, next) {
    const keyword = request.params.keyword;
    const sortCase = request.params.sortCase;

    let search = '';

    if (keyword != 'none') {
        search = ' WHERE goods_name Like "%' + keyword + '%" or goods_tag1 Like "%' + keyword + '%" or goods_tag2 Like "%' + keyword + '%" or goods_tag3 Like "%' + keyword + '%"';
    }

    const order = sortCaseReplace(sortCase);

    db.query(sql.goods_searchlist + search + order, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '검색에러' });
        }
        response.json(results);
    });
});

// 상품 상세페이지 
router.get('/goodsDetail/:goodsno', function (request, response, next) {
    const goodsno = request.params.goodsno;
    console.log(goodsno);
    db.query(sql.goods_detail, [goodsno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '상품디테일에러' });
        }
        response.json(results);
    });
});

// 상품 결제 
router.post('/orderPayment', function (request, response, next) {
    const { order, order_detail } = request.body;
    console.log(order);
    console.log(order_detail);

    db.query(sql.order_payment, [order.order_nm, order.order_adr1, order.order_adr2, order.order_zipcode, order.order_mobile,
    order.order_memo, order.order_amt, order.order_dc, order.order_delivery, order.order_total, order.user_no, order.order_tp],
        function (error, results, fields) {
            if (error) {
                return response.status(500).json({
                    message: 'DB_error'
                });
            }
            // 삽입된 주문의 ORDER_TRADE_NO
            const orderTradeNo = results.insertId;

            if (Array.isArray(order_detail)) {
                const detailPromises = order_detail.map((detail) => {
                    return new Promise((resolve, reject) => {
                        db.query(sql.order_payment_detail, [orderTradeNo, detail.goods_no, detail.order_goods_name, detail.order_goods_price,
                            detail.order_goods_img, detail.order_goods_cnt],
                            function (error, results, fields) {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve();
                                }
                            });
                    });
                });

                Promise.all(detailPromises)
                    .then(() => {
                        db.query(sql.order_goods_cnt, [order_detail.goods_cnt, order_detail.goods_no], function (error) {
                            if (error) {
                                return response.status(500).json({
                                    message: 'DB_error'
                                });
                            }

                            if (order.order_dc > 0) {
                                db.query(sql.order_usepoint, [order.order_dc, order.user_no], function (error) {
                                    if (error) {
                                        return response.status(500).json({
                                            message: 'DB_error'
                                        });
                                    }

                                    return response.status(200).json({
                                        message: '완료'
                                    });
                                });
                            } else {
                                return response.status(200).json({
                                    message: '완료'
                                });
                            }
                        });
                    })
                    .catch(() => {
                        return response.status(500).json({
                            message: 'DB_error'
                        });
                    });
            } else {
                // order_detail이 배열이 아닌 경우에는 해당 주문 상세 정보 하나만 처리
                db.query(sql.order_payment_detail, [orderTradeNo, order_detail.goods_no, order_detail.order_goods_name, order_detail.order_goods_price,
                    order_detail.order_goods_img, order_detail.order_goods_cnt],
                    function (error, results, fields) {
                        if (error) {
                            return response.status(500).json({
                                message: 'DB_error'
                            });
                        }
                        db.query(sql.order_goods_cnt, [order_detail.goods_cnt, order_detail.goods_no], function (error) {
                            if (error) {
                                return response.status(500).json({
                                    message: 'DB_error'
                                });
                            }

                            if (order.order_dc > 0) {
                                db.query(sql.order_usepoint, [order.order_dc, order.user_no], function (error) {
                                    if (error) {
                                        return response.status(500).json({
                                            message: 'DB_error'
                                        });
                                    }

                                    return response.status(200).json({
                                        message: '완료'
                                    });
                                });
                            } else {
                                return response.status(200).json({
                                    message: '완료'
                                });
                            }
                        });
                    });
            }
        });
});

// 주문 리스트
router.get('/orderlist_sort/:userno/:sortCase/:page/:pagesize', function (request, response, next) {

    const userno = request.params.userno;
    const sortCase = request.params.sortCase;
    const pagesize =  parseInt(request.params.pagesize);
    const page = request.body.page || 1; 
    const offsetPage = 0 + (page - 1) * 10;

  const order = sortCaseReplace3(sortCase)
    db.query(sql.orderlist + order, [userno, pagesize ,offsetPage], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '결제리스트에러' });
        }
        response.json(results);
    });
});
function sortCaseReplace3(sortCase) {
    let order = ` ORDER BY o.orders_no DESC LIMIT ? OFFSET ?`; // 최근1년
    if (sortCase == 1) { // 가격순
      order = ` ORDER BY orders_goods_price DESC LIMIT ? OFFSET ?`;
    }
    else if (sortCase == 2) { // 배송 중
      order = ` AND orders_status = 1 ORDER BY o.orders_no DESC LIMIT ? OFFSET ?`;
    }
    else if (sortCase == 3) { // 구매확정
      order = ` AND orders_status = 3 ORDER BY o.orders_no DESC LIMIT ? OFFSET ?`;
    }
    return order;
  }

// 주문 리스트
router.get('/orderlist/:userno', function (request, response, next) {

    const userno = request.params.userno;
    db.query(sql.orderlist, [userno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '결제리스트에러' });
        }
        response.json(results);
    });
});

// 주문 상세보기
router.get('/orderUser/:orderno', function (request, response, next) {
    const orderno = request.params.orderno;
    db.query(sql.orderlist_user, [orderno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '결제회원에러' });
        }
        response.json(results);
    });
});
router.get('/delivery/:orderno', function (request, response, next) {
    const orderno = request.params.orderno;
    db.query(sql.delivery, [orderno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '배송리스트에러' });
        }
        response.json(results);
    });
});
router.get('/orderODetail/:orderno', function (request, response, next) {
    const orderno = request.params.orderno;
    db.query(sql.orderlist_o_detail, [orderno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '결제리스트에러' });
        }
        response.json(results);
    });
});
router.get('/orderDDetail/:orderno', function (request, response, next) {
    const orderno = request.params.orderno;
    db.query(sql.orderlist_d_detail, [orderno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '결제리스트에러' });
        }
        response.json(results);
    });
});

router.get('/orderGDetail/:orderno', function (request, response, next) {
    const orderno = request.params.orderno;
    db.query(sql.ordergoods_detail, [orderno], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '결제리스트에러' });
        }
        response.json(results);
    });
});

// 구매 확정 적립금
router.post('/orderPoint/:ORDERS_NO/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;
    const orders_no = request.params.ORDERS_NO;
    db.query(sql.confirm_point, [orders_no, user_no], function (error) {
        if (error) {
            return response.status(500).json({
                message: 'DB_error'
            });
        }
        return response.status(200).json({
            message: '완료'
        });
    });
})

// 구매 취소 적립금 돌려주기
router.post('/orderPointRollback/:user_no/:order_dc', function (request, response, next) {
    const user_no = request.params.user_no;
    const order_dc = request.params.order_dc;

    db.query(sql.cancel_point, [order_dc, user_no], function (error) {
        if (error) {
            return response.status(500).json({
                message: 'DB_error'
            });
        }
        return response.status(200).json({
            message: '완료'
        });
    });
})

// 구매 취소 재고 롤백
router.post('/goodsRollback', function (request, response, next) {
    const goods = request.body;

    if (Array.isArray(goods)) {
        const rollbackPromises = goods.map((detail) => {
            return new Promise((resolve, reject) => {
                db.query(sql.cancel_goods, [detail.goods_cnt, detail.goods_no], function (error, results, fields) {
                    if (error) {
                        console.error(error);
                        reject(error);
                    } else {
                        resolve();
                    }
                });x
            });
        });
        Promise.all(rollbackPromises)
            .then(() => {
                return response.status(200).json({
                    message: 'completed'
                });
            })
            .catch((error) => {
                console.error(error);
                return response.status(500).json({
                    message: 'DB_error'
                });
            });
    } else {
        return response.status(400).json({
            message: 'error'
        });
    }
});


// admin 주문관리 정렬방식 
function orderSort(sortCase) {
    let order = ` ORDER BY o.ORDERS_NO`; //전체 오래된순
    if (sortCase == 0) { // 결제완료
        order = ` WHERE o.ORDERS_STATUS = 0`;
    }
    else if (sortCase == 1) { // 배송중 
        order = ` WHERE o.ORDERS_STATUS = 1`;
    }
    else if (sortCase == 2) { // 배송완료 
        order = ` WHERE o.ORDERS_STATUS = 2`;
    }
    else if (sortCase == 3) { // 구매확정 
        order = ` WHERE o.ORDERS_STATUS = 3`;
    }
    else if (sortCase == 9) {  // 취소
        order = ` WHERE o.ORDERS_STATUS = 9`;
    }
    return order;
}

// admin 주문관리 내역
router.get('/admin/orderM/:sortCase/:keyword/:page/:pagesize', function (request, response, next) {

    const page = request.body.page || 1;
    const pagesize =  parseInt(request.params.pagesize);
    const offsetPage = 0 + (page - 1) * 10;
    const sortCase = request.params.sortCase;
    const keyword = request.params.keyword;
    const order = orderSort(sortCase);
    let search = '';

    // const order = sortCaseReplace(sortCase);

    if (keyword != 'none') {
        search = ' WHERE u.user_name Like "%' + keyword + '%"';
    }

    db.query(sql.admin_orderlist + search + order, [pagesize, offsetPage], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '주문관리리스트에러' });
        }
        response.json(results);
    });
});

router.post('/admin/orderM_list', (req, res) => {
    const orderpage = req.body;
    const page = req.body.page || 1;
    const offsetPage = 0 + (page - 1) * 10;
    db.query(sql.admin_orderlist2, [orderpage.pagesize, offsetPage], (err, result, fields) => {
        res.send(result);
    });
});

router.post('/boardlistcnt/:user_no', (req, res) => {
    const user_no = req.params.user_no;
    db.query(sql.ordercnt2, [user_no], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: '에러' });
        }
        return res.status(200).json(results[0]['COUNT(*)']);
    });
});


// admin 주문관리 내역
router.get('/admin/orderM/:sortCase/:keyword', function (request, response, next) {
    
    const sortCase = request.params.sortCase;
    const keyword = request.params.keyword;
    const order = orderSort(sortCase);
    let search = '';

    if (keyword != 'none') {
        search = ' WHERE u.user_name Like "%' + keyword + '%"';
    }

    db.query(sql.admin_orderlist + search + order, function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '주문관리리스트에러' });
        }
        response.json(results);
    });
});

// admin 주문상태 업데이트
router.post('/admin/updateStatus', function (request, response, next) {
    const orderNos = request.body.orderNos;
    const status = request.body.status;

    db.query(sql.order_status_update, [status, orderNos], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json({ message: 'complete' });
    });
});

router.post('/my/order_list', (req, res) => {
    const orderpage = req.body;
    const page = req.body.page || 1;
    const offsetPage = 0 + (page - 1) * 10;
    db.query(sql.orderlist, [orderpage.pagesize, offsetPage], (err, result, fields) => {
        res.send(result);
    });
});

router.post('/boardlistcnt/:user_no', (req, res) => {
    const user_no = req.params.user_no;
    db.query(sql.ordercnt, [user_no],(error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: '에러' });
        }
        return res.status(200).json(results[0]['COUNT(*)']);
    });
});

// 찜 추가
router.post('/likeInsert/:goodsno/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;
    const goods_no = request.params.goodsno;

    db.query(sql.like_check, [user_no, goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }

        if (results.length > 0) {
            return response.status(200).json({ message: 'complete', isLiked: true });
        } else {
            db.query(sql.like_insert, [user_no, goods_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: '에러' });
                }

                return response.status(200).json({ message: 'complete', isLiked: false });
            });
        }
    });
});

// 찜 체크
router.post('/likeCheck/:goodsno/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;
    const goods_no = request.params.goodsno;

    if (user_no == 'null') {
        return response.status(200).json({ message: 'complete', isLiked: false });
    }

    db.query(sql.like_check, [user_no, goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }

        if (results.length > 0) {
            return response.status(200).json({ message: 'complete', isLiked: true });
        } else {
            return response.status(200).json({ message: 'complete', isLiked: false });
        }
    });
});

// 찜 제거
router.post('/likeDelete/:goodsno/:user_no', function (request, response, next) {
    const user_no = request.params.user_no;
    const goods_no = request.params.goodsno;

    db.query(sql.like_delete, [user_no, goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json({ message: 'complete' });
    });
});

// 찜 카운트
router.get('/likeCount/:goodsno', function (request, response, next) {
    const goods_no = request.params.goodsno;

    db.query(sql.like_count, [goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: '에러' });
        }
        return response.status(200).json(results[0]['COUNT(*)']);
    });
});


// 리뷰 작성
router.post('/write_review', function (request, response, next) {

    const review = request.body;
   
    // 이미지를 제외한 리뷰 정보 먼저 입력
    db.query(sql.review_write, [review.content, review.user_no, review.goods_no, review.orders_no, review.orders_status, review.review_score], function (error, result) {
        
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'error' });
        }

        // 이미지 있을 경우
        if (review.review_img != '') {
            //console.log(review.orders_no);
            // 리뷰 번호 확인
            db.query(sql.get_review_no, [review.orders_no], function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return response.status(500).json({ error: 'error' });
                }

                const filename = results[0].review_no;
                console.log(filename);
                const pastDir = `${__dirname}` + `../../uploads/` + review.review_img;
                const newDir = `${__dirname}` + `../../uploads/uploadReview/`;

                const extension = review.review_img.substring(review.review_img.lastIndexOf('.'))

                fs.rename(pastDir, newDir + filename + extension, (err) => {
                    if (err) {
                       
                        return response.status(500).json();
                    }
                    else {
                        // 리뷰 이미지 삽입
                        
                        db.query(sql.review_img_insert, [filename + extension, results[0].review_no], function (error, results, fields) {
                            if (error) {
                                return response.status(500).json();
                            }
                        })
                    }
                });
            })
        }

        // 주문 상세에서 리뷰 체크 속성 0 -> 1 변경
        db.query(sql.check_review, [review.order_no], function (error, results, fields) {
            if (error) {
                console.error(error);
                return response.status(500).json({ error: 'error' });
            }
        })

        return response.status(200).json({
            message: 'review_complete'
        });
    })
});

// 상품 상세 페이지 리뷰 리스트 불러오기
router.get('/getReview/:goodsno', function (request, response, next) {
    const goods_no = request.params.goodsno;

    db.query(sql.goods_get_review, [goods_no], function (error, results, fields) {
        if (error) {
            console.error(error);
            return response.status(500).json({ error: 'DB 에러' });
        }
        return response.json(results);
    })
})


// 장바구니 목록 불러오기
router.get('/cartInfo/:user_no', async (req,res)=>{
    const user_no = req.params.user_no;
    db.query(sql.cartInfo, [user_no], function (error,results){
        if(error){
            console.error(error);
            return res.status(500).json({error:'장바구니 불러오기 DB에러'});
        }
        return res.status(200).json({results})
    })
})

// 장바구니 갯수 변경
router.get('/cartUpdate/:user_no/:goods_no/:cnt', async (req,res)=>{
    const user_no = req.params.user_no;
    const goods_no = req.params.goods_no;
    const cnt = req.params.cnt;
    console.log(user_no,goods_no,cnt)
    db.query(sql.cart_update, [cnt,user_no,goods_no], function (error,results){
        if(error){
            console.error(error);
            return res.status(500).json({error:'장바구니 갯수 변경 DB에러'});
        }
        return res.status(200).json({results})
    })
})

router.get('/deleteCart/:user_no/:goods_no/:cnt', async (req,res)=>{
    const user_no = req.params.user_no;
    const goods_no = req.params.goods_no;
    const cnt = req.params.cnt;

    console.log(user_no,goods_no,cnt)

    db.query(sql.cart_delete, [user_no,goods_no,cnt], function (error,results){
        if(error){
            console.error(error);

            return res.status(500).json({error:'장바구니 상품 삭제 DB에러'});
        }
        return res.status(200).json({results})
    })
})

router.post('/add-cart', (req, res) => {
    // req에서 바디에 상품번호, 상품 갯수
    // REQ 쿼리파라미터는 유저번호를 받는다
    const userNo = req.query.userNo;
    const goodsNo = req.body.goodsNo;
    const cartGoodsCnt = req.body.cartGoodsCnt;
    // DB 에 sql.addCart 수행 (USER_NO, GOODS_NO, CART_GOODS_CNT)
    db.query(sql.addCart, [userNo, goodsNo, cartGoodsCnt], function (error, results, fields) {
        if (error) {
            console.error(error);
            return res.status(500).json({error: '에러'});
        } else {
            return res.status(200).json({message: 'complete'})
        }
    })
})

router.post('/orderPro', async function (request, response) {
    try {
        console.log(request.body);
        const orders_user_no = request.body.orders_user_no;
        const orders_goods_cnt = request.body.orders_goods_cnt;
        const orders_amt = request.body.orders_amt;
        const orders_total = request.body.orders_total;
        const orders_delivery = request.body.orders_delivery;
        const orders_payment = request.body.orders_payment;
        const orders_discount = request.body.orders_discount;
        const orders_type = request.body.orders_type;
        const deli_no = request.body.orders_deli_no;


        // 첫 번째 쿼리 실행
        const orderResult = await db.promise().query(sql.orders_order, [orders_user_no, orders_goods_cnt, orders_amt, orders_total, orders_delivery, orders_payment, orders_discount, orders_type, deli_no]);
        console.log(orderResult);
        // 두 번째 쿼리 실행
        const [orders_noResult] = await db.promise().query('SELECT LAST_INSERT_ID() as orders_no');
        const orders_no = orders_noResult[0].orders_no;

        return response.status(200).json({
            message: '성공!',
            orders_no: orders_no // 가져온 orders_no를 반환합니다.
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: '에러 발생' });
    }
});

router.post('/orderGoodsCnt', (request, response) => {
    // 비구조화 할당을 통해 goods_no와 goods_cnt 추출
    const { goods_no, goods_cnt } = request.body;

    // 데이터베이스에 goods_cnt 업데이트를 시도
    db.query(sql.goods_cnt_update, [goods_cnt, goods_no], (error, results) => {
        if (error) {
            console.error(error);
            return response.status(500).send('서버 오류.');
        }

        // affectedRows를 확인하여 실제로 업데이트가 이루어졌는지 검사
        if (results.affectedRows > 0) {
            console.log('데이터 업데이트 성공:', results);
            response.send('데이터 업데이트 성공.');
        } else {
            console.log('업데이트할 데이터가 없습니다.');
            response.status(404).send('업데이트할 데이터가 없습니다.');
        }
    });
});

router.post('/orderDetailInsert', async (request, response) => {
      console.log(request.body);
      const ordersdetail_orders_no = request.body.ordersdetail_orders_no;
      const ordersdetail_user_no = request.body.ordersdetail_user_no;
      const ordersdetail_goods_no = request.body.ordersdetail_goods_no;
      const ordersdetail_orders_goods_name = request.body.ordersdetail_orders_goods_name;
      const ordersdetail_orders_goods_price = request.body.ordersdetail_orders_goods_price;
      const ordersdetail_orders_goods_img = request.body.ordersdetail_orders_goods_img;
      const ordersdetail_orders_goods_cnt = request.body.ordersdetail_orders_goods_cnt;
      const ordersdetail_deli_no = request.body.ordersdetail_deli_no;
    try {
        // 주문 상세 데이터를 데이터베이스에 삽입합니다.
        const orderDetailResult = await db.promise().query(sql.orders_detail_insert, [ordersdetail_orders_no, ordersdetail_user_no, ordersdetail_goods_no, ordersdetail_orders_goods_name, ordersdetail_orders_goods_price, ordersdetail_orders_goods_img, ordersdetail_orders_goods_cnt, ordersdetail_deli_no]);
        console.log(orderDetailResult);
        // 클라이언트로 성공 메시지와 함께 삽입된 주문 상세의 ID를 보냅니다.
        return response.status(200).json({
            message: '주문 상세 정보가 성공적으로 추가되었습니다.',
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: '에러 발생' });
    }
});

router.post('/orderPay', function (request, response) { //order의 정보를 임시저장
    payStorage = request.body;

    console.log(payStorage); // 저장된 데이터를 확인합니다.
  
    response.send('데이터전달 확인.');
});

router.get('/orderPayGet', function (request, response) { //임시저장한 order를 불러옮
    
    response.json(payStorage);
    
});

router.post('/orderDeliPay', function (request, response) { //deli의 정보를 임시저장
    deliStorage = request.body;
    
    console.log(deliStorage); // 저장된 데이터를 확인합니다.
  
    response.send('데이터전달 확인.');
});

router.get('/orderDeliPayGet', function (request, response) { //임시저장한 deli를 불러옮
    
    response.json(deliStorage);
    
});

router.post('/orderGoodsPay', function (request, response) { //goods의 정보를 임시저장
    goodsStore = request.body;
    
    console.log(goodsStore); // 저장된 데이터를 확인합니다.
  
    response.send('데이터전달 확인.');
});

router.get('/orderGoodsPayGet', function (request, response) { //임시저장한 goods를 불러옮
    
    response.json(goodsStore);
    
});

router.post('/orderDetailPay', function (request, response) { //od의 정보를 임시저장
    orderDetailSrore = request.body;
    
    console.log(orderDetailSrore); // 저장된 데이터를 확인합니다.
  
    response.send('데이터전달 확인.');
});

router.get('/orderDetailPayGet', function (request, response) { //임시저장한 od를 불러옮
    
    response.json(orderDetailSrore);
    
});


router.post('/orderPro2', (request, response) => {
    // 비구조화 할당을 통해 goods_no와 goods_cnt 추출
    const { deli_no, orders_no } = request.body;

    // 데이터베이스에 goods_cnt 업데이트를 시도
    db.query(sql.orders_deli_no_update, [deli_no, orders_no], (error, results) => {
        if (error) {
            console.error(error);
            return response.status(500).send('서버 오류.');
        }

        // affectedRows를 확인하여 실제로 업데이트가 이루어졌는지 검사
        if (results.affectedRows > 0) {
            console.log('데이터 업데이트 성공:', results);
            response.send('데이터 업데이트 성공.');
        } else {
            console.log('업데이트할 데이터가 없습니다.');
            response.status(404).send('업데이트할 데이터가 없습니다.');
        }
    });
});

module.exports = router;