"use strict"

const express = require('express');
const app = express();
const request = require('request');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const TelegramBaseInlineQueryController = Telegram.TelegramBaseInlineQueryController
const tg = new Telegram.Telegram('204461749:AAGR26f_2eN3nAwekbDMuY1zkQfHHptoPl0')

var phone;
var code;
var send;
var login;
var nombre;
var apellido;
var balance;
var telegramId;
var minkaId;

class StartController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    startHandler($) {
      $.sendMessage('hola ' + $._message._from._firstName + " gracias por utilizar mislukasbot para empezar puedes mirar con el comando /help todo lo que puedes hacer");
    }

    get routes() {
        return {
            '/start': 'startHandler'
        }
    }
}

class RegistroController extends TelegramBaseController {

  /*
  datos que trae para hacer el RegistroHandler
  firstname, lastname, phone, userId, code,
  */
  registroHandler($) {
    nombre = $._message._from._firstName;
    apellido = $._message._from._lastName;
    telegramId = $._message._from._id;
    phone = $.query.phone;
    code = $.query.code;
    var info = JSON.stringify({
      "firstname": nombre,
      "lastname": apellido,
      "phone": phone,
      "telegramId": telegramId,
      "code": code
    });
    request.post({
      type: "POST",
      url: 'http://api.minka.io:8081/telegram/registro',
      headers: {
        "content-type" : "application/json"
      },
      body: info,
      dataType: 'json'
    }, function(err, response, body){
      var datos = JSON.parse(body);
      if(err){
          console.log(err)
      }else if(datos != null) {
        $.sendMessage($._message._from._firstName + " te has registrado con exito.");
      }else {
        $.sendMessage("Algo ha salido mal vuelve a hacer el proceso con el comando /registro");
      }
    });
  }

  get routes() {
      return {
          '/registro :phone :code': 'registroHandler'
      }
  }
}

class LoginController extends TelegramBaseController {

  LoginHandler($) {
    $.sendMessage('hola desde la clave');
    code = $.query.code;
    var info = JSON.stringify({
      "telegramId": $._message._from._id,
      "code": code
    });
    request.post({
      type: "POST",
      url: 'http://api.minka.io:8081/telegram/loginMislukas',
      headers: {
        "content-type": "application/json",
      },
      body: info,
      dataType: 'json'
      }, function(err, response, body){
      var datos = JSON.parse(body);
      if(err){
        console.log(err);
        return;
      }else if(datos.verificado){
        login = true;
        nombre = datos.nombre;
        apellido = datos.apellido;
        phone = datos.phone;
        balance = datos.balance;
        minkaId = datos.id;
        telegramId = datos.idTelegram;
        $.sendMessage(datos.message);
      }else{
        send = false;
        $.sendMessage(datos.message);
      }
    });
  }

  get routes() {
      return {
          '/login :code': 'LoginHandler'
      }
  }
}

class SaldoController extends TelegramBaseController {

  SaldoHandler($) {
    if(login == true){
      request.get({
            type: "GET",
            url: 'http://api.minka.io:8081/person/'+minkaId+'/balance',
            headers: {
              "content-type": "application/json",
            },
            dataType: 'json'
          }, function(err, response, body){
            var datos = JSON.parse(body);
            var saldo = datos.wallet;
            if(err){
              console.log(err)
            }else if(datos.wallet){
                $.sendMessage(nombre +" tu saldo en estos momentos es de " + saldo.balance + " LUK");
            }
          });
    }else{
      $.sendMessage("Aun no te has logueado y si no me dejas saber quien eres no te puedo ayudar :c, dime quien eres con el comando /login");
    }
  }

  get routes() {
      return {
          '/saldo': 'SaldoHandler'
      }
  }

}

class EnviarController extends TelegramBaseController {

  EnviarHandler($) {
    var info = JSON.stringify({
      "phoneSend": phone,
      "phoneReceive": $.query.telefono,
      "amount": {
        "currency": "45646514",
        "value": $.query.valor
      }
    });
    console.log(info);
    request.post({
      type: "POST",
      url: 'http://api.minka.io:8081/transfer',
      headers: {
        "content-type": "application/json",
      },
      body: info,
      dataType: 'json'
      }, function(err, response, body){
        var datos = JSON.parse(body);
        if(err){
          console.log(err)
        }else if(datos != null && datos.status){
          $.sendMessage('Tu transferencia/pago se realizo con exito, si quieres ejecuta el comando /saldo y mira como quedo tu saldo');
        }else{
          $.sendMessage('Tu transferencia/pago no se pudo procesar');
        }
    });
  }

  get routes() {
      return {
          '/enviar :valor :telefono': 'EnviarHandler'
      }
  }

}

// class CodigoController extends TelegramBaseController {
//
//   CodigoHandler($) {
//     $.sendMessage('hola desde el codigo');
//   }
//
//   get routes() {
//       return {
//           '/codigo': 'CodigoHandler'
//       }
//   }
// }



// class mislukasController extends TelegramBaseInlineQueryController {
//
//     handle($) {
//       $.getChat().then(function(msg){
//         console.log(msg)
//       });
//       $.getChatMember($.userId).then(function(msg){
//          console.log(msg)
//       });
//       $.getChatMembersCount().then(function(msg){
//          console.log(msg)
//       });
//     }
//
// }

tg.router
    .when(['/start'], new StartController())
    .when('/login :code', new LoginController())
    .when('/enviar :valor :telefono', new EnviarController())
    .when('/saldo', new SaldoController())
    .when(['/registro :phone :code'], new RegistroController())
    //.inlineQuery(new mislukasController())
