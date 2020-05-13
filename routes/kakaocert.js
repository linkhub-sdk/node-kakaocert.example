var express = require('express');
var router = express.Router();
var kakaocert = require('kakaocert');

kakaocert.config({

    // 링크아이디
    LinkID: 'TESTER',

    // 비밀키
    SecretKey: 'SwWxqU+0TErBXy/9TVjIPEnI0VTUMMSQZtJf3Ed8q3I=',

    // 인증토큰 IP제한기능 사용여부, 권장(true)
    IPRestrictOnOff: true,

    // 인증토큰정보 로컬서버 시간 사용여부
    UseLocalTimeYN: true,

    defaultErrorHandler: function (Error) {
        console.log('Error Occur : [' + Error.code + '] ' + Error.message);
    }
});

/*
 * Kakaocert API 서비스 클래스 생성
 */
var kakaocertService = kakaocert.KakaocertService();


/*
  * 자동이체 출금동의 인증을 요청합니다.
  * - 해당 서비스는 전자서명을 하는 당사자와 출금계좌의 예금주가 동일한 경우에만 사용이 가능합니다.
  * - 전자서명 당사자와 출금계좌의 예금주가 동일인임을 체크하는 의무는 이용기관에 있습니다.
  * - 금융결제원에 증빙자료(전자서명 데이터) 제출은 이용기관 측 에서 진행해야 합니다.
  */
router.get('/RequestCMS', function (req, res, next) {

  // Kakaocert 이용기관코드, Kakaocert 파트너 사이트에서 확인
  var clientCode = '020040000001';

  // 자동이체 출금동의 요청정보 객체
  var requestCMS = {

    // 고객센터 전화번호, 카카오톡 인증메시지 중 "고객센터" 항목에 표시
    CallCenterNum : '1600-8536',

    // 인증요청 만료시간(초), 최대값 1000, 인증요청 만료시간(초) 내에 미인증시 만료 상태로 처리됨
    Expires_in : 60,

    // 수신자 생년월일, 형식 : YYYYMMDD
    ReceiverBirthDay : '19700101',

    // 수신자 휴대폰번호
    ReceiverHP : '01012341234',

    // 수신자 성명
    ReceiverName : '홍길동',

    // 예금주명
    BankAccountName : '예금주명',

    // 은행코드
    BankCode : '004',

    // 계좌번호, 사용자가 식별가능한 범위내에서 계좌번호의 일부를 마스킹 처리할 수 있음(예시) 371-02-6***85
    BankAccountNum : '9-4324-5**7-58',

    // 납부자 식별번호, 이용기관에서 부여한 고객식별번호
    ClientUserID : 'clientUserID-0423-01',

    // 별칭코드
    // 이용기관이 생성한 별칭코드 (파트너 사이트에서 확인가능)
    // 카카오톡 인증메시지 중 "요청기관" 항목에 표시
    // 별칭코드 미 기재시 이용기관의 이용기관명이 "요청기관" 항목에 표시
    SubClientID : '',

    // 인증요청 메시지 제목, 카카오톡 인증메시지 중 "요청구분" 항목에 표시
    TMSTitle : 'TMSTitle 0423',

    // 인증요청 메시지 부가내용, 카카오톡 인증메시지 중 상단에 표시
    TMSMessage : 'TMSMessage0423',

    /*
    * 은행계좌 실명확인 생략여부
    * - true : 은행계좌 실명확인 절차를 생략
    * - false : 은행과제 실명확인 절차를 진행
    *
    * 카카오톡 인증메시지를 수신한 사용자가 카카오인증 비회원일 경우,
    * 카카오인증 회원등록 절차를 거쳐 은행계좌 실명확인 절차를 밟은 다음 전자서명 가능
    */
    isAllowSimpleRegistYN : false,

    /*
    * 수신자 실명확인 여부
    * true : 카카오페이가 본인인증을 통해 확보한 사용자 실명과 ReceiverName 값을 비교
    * false : 카카오페이가 본인인증을 통해 확보한 사용자 실명과 RecevierName 값을 비교하지 않음.
    */
    isVerifyNameYN : false,

    // 이용기관이 생성한 payload(메모) 값
    PayLoad : 'Payload123',
  };

  kakaocertService.requestCMS(clientCode, requestCMS,
    function(result){
      res.render('result', {path: req.path, result: result.receiptId});
    }, function(error){
      res.render('response', {path: req.path, code: error.code, message: error.message});
  });
});

/*
  * 자동이체 출금동의 요청결과를 확인합니다.
  */
router.get('/GetCMSResult', function (req, res, next) {

  // Kakaocert 이용기관코드, Kakaocert 파트너 사이트에서 확인
  var clientCode = '020040000001';

  // 자동이체 출금동의 요청시 반환받은 접수아이디
  var receiptId = '020050414211600001';

  kakaocertService.getCMSResult(clientCode, receiptId,
    function(response){
        res.render('getCMSResult', {path: req.path, result: response});
    }, function(error){
        res.render('response', {path: req.path, code: error.code, message: error.message});
    });
});

/*
* 본인인증 전자서명을 요청합니다.
* - 본인인증 서비스에서 이용기관이 생성하는 Token은 사용자가 전자서명할 원문이 됩니다. 이는 보안을 위해 1회용으로 생성해야 합니다.
* - 사용자는 이용기관이 생성한 1회용 토큰을 서명하고, 이용기관은 그 서명값을 검증함으로써 사용자에 대한 인증의 역할을 수행하게 됩니다.
*/
router.get('/RequestVerifyAuth', function (req, res, next) {

  // Kakaocert 이용기관코드, Kakaocert 파트너 사이트에서 확인
  var clientCode = '020040000001';

  // 본인인증 요청정보 객체
  var requestVerifyAuth = {

    // 고객센터 전화번호, 카카오톡 인증메시지 중 "고객센터" 항목에 표시
    CallCenterNum : '1600-8536',

    // 인증요청 만료시간(초), 최대값 1000, 인증요청 만료시간(초) 내에 미인증시 만료 상태로 처리됨
    Expires_in : 60,

    // 수신자 생년월일, 형식 : YYYYMMDD
    ReceiverBirthDay : '19900108',

    // 수신자 휴대폰번호
    ReceiverHP : '01012341234',

    // 수신자 성명
    ReceiverName : '홍길동',

    // 별칭코드, 이용기관이 생성한 별칭코드 (파트너 사이트에서 확인가능)
    SubClientID : '',

    // 인증요청 메시지 부가내용, 카카오톡 인증메시지 중 상단에 표시
    TMSMessage : 'TMSMessage0423',

    // 인증요청 메시지 제목, 카카오톡 인증메시지 중 "요청구분" 항목에 표시
    TMSTitle : 'TMSTitle 0423',

    /*
    * 은행계좌 실명확인 생략여부
    * true : 은행계좌 실명확인 절차를 생략
    * false : 은행계좌 실명확인 절차를 진행
    *
    * 카카오톡 인증메시지를 수신한 사용자가 카카오인증 비회원일 경우,
    * 카카오인증 회원등록 절차를 거쳐 은행계좌 실명확인 절차를 밟은 다음 전자서명 가능
    */
    isAllowSimpleRegistYN : true,

    /*
    * 수신자 실명확인 여부
    * true : 카카오페이가 본인인증을 통해 확보한 사용자 실명과 ReceiverName 값을 비교
    * false : 카카오페이가 본인인증을 통해 확보한 사용자 실명과 RecevierName 값을 비교하지 않음.
    */
    isVerifyNameYN : true,

    // 전자서명 원문, 사용자가 전자서명할 원문, 보안을 위해 1회용으로 생성
    Token : 'Token Value 2345',

    // 이용기관이 생성한 payload(메모) 값
    PayLoad : 'Payload123',

  };

  kakaocertService.requestVerifyAuth(clientCode, requestVerifyAuth,
    function(result){
        res.render('result', {path: req.path, result: result.receiptId});
    }, function(error){
        res.render('response', {path: req.path, code: error.code, message: error.message});
    });
});

/*
* 본인인증 요청결과를 확인합니다.
*/
router.get('/GetVerifyAuthResult', function (req, res, next) {

  // Kakaocert 이용기관코드, Kakaocert 파트너 사이트에서 확인
  var clientCode = '020040000001';

  // 본인인증 요청시 반환받은 접수아이디
  var receiptId = '020050710115800001';

  kakaocertService.getVerifyAuthResult(clientCode, receiptId,
    function(response){
        res.render('getVerifyAuthResult', {path: req.path, result: response});
    }, function(error){
        res.render('response', {path: req.path, code: error.code, message: error.message});
    });

});

/*
* 간편 전자서명 인증을 요청합니다.
*/
router.get('/RequestESign', function (req, res, next) {

  // Kakaocert 이용기관코드, Kakaocert 파트너 사이트에서 확인
  var clientCode = '020040000001';

  // 간편 전자서명 요청정보 객체
  var requestESign = {

    // 고객센터 전화번호, 카카오톡 인증메시지 중 "고객센터" 항목에 표시
    CallCenterNum : '1600-8536',

    // 인증요청 만료시간(초), 최대값 1000, 인증요청 만료시간(초) 내에 미인증시 만료 상태로 처리됨
    Expires_in : 60,

    // 수신자 생년월일, 형식 : YYYYMMDD
    ReceiverBirthDay : '19900108',

    // 수신자 휴대폰번호
    ReceiverHP : '01012341234',

    // 수신자 성명
    ReceiverName : '홍길동',

    // 별칭코드, 이용기관이 생성한 별칭코드 (파트너 사이트에서 확인가능)
    // 카카오톡 인증메시지 중 "요청기관" 항목에 표시
    // 별칭코드 미 기재시 이용기관의 이용기관명이 "요청기관" 항목에 표시
    SubClientID : '',

    // 인증요청 메시지 부가내용, 카카오톡 인증메시지 중 상단에 표시
    TMSMessage : 'TMSMessage0423',

    // 인증요청 메시지 제목, 카카오톡 인증메시지 중 "요청구분" 항목에 표시
    TMSTitle : 'TMSTitle 0423',

    // 은행계좌 실명확인 생략여부
    // true : 은행계좌 실명확인 절차를 생략
    // false : 은행계좌 실명확인 절차를 진행
    // 카카오톡 인증메시지를 수신한 사용자가 카카오인증 비회원일 경우, 카카오인증 회원등록 절차를 거쳐 은행계좌 실명확인 절차를 밟은 다음 전자서명 가능
    isAllowSimpleRegistYN : false,

    // 수신자 실명확인 여부
    // true : 카카오페이가 본인인증을 통해 확보한 사용자 실명과 ReceiverName 값을 비교
    // false : 카카오페이가 본인인증을 통해 확보한 사용자 실명과 RecevierName 값을 비교하지 않음.
    isVerifyNameYN : true,

    // 전자서명할 토큰 원문
    Token : 'Token Value 2345',

    // PayLoad, 이용기관이 생성한 payload(메모) 값
    PayLoad : 'Payload123',
  };

  kakaocertService.requestESign(clientCode, requestESign,
    function(result){
        res.render('result', {path: req.path, result: result.receiptId});
    }, function(error){
        res.render('response', {path: req.path, code: error.code, message: error.message});
    });

});

/*
* 간편 전자서명 요청결과를 확인합니다.
*/
router.get('/GetESignResult', function (req, res, next) {

  // Kakaocert 이용기관코드, Kakaocert 파트너 사이트에서 확인
  var clientCode = '020040000001';

  // 전자서명 요청시 반환받은 접수아이디
  var receiptId = '020050710183000001';

  kakaocertService.getESignResult(clientCode, receiptId,
    function(response){
        res.render('getESignResult', {path: req.path, result: response});
    }, function(error){
        res.render('response', {path: req.path, code: error.code, message: error.message});
    });

});


module.exports = router;
