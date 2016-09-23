
var tg = require('telegram-node-bot')('204461749:AAGR26f_2eN3nAwekbDMuY1zkQfHHptoPl0');
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var phone;
var code;
var send;
var login;
var nombre;
var apellido;
var balance;
var telegramId;
var minkaId;
var saldo;

//console.log(tg.router.when);
// var str = tg.message.text;
// var n = str.includes("start");
// if(n){
//   saldo = "saldo";
// }


tg.router
  .when('start', 'StartController')
  .when('enviar', 'EnviarController')
  .when('saldo', 'SaldoController')
  .when('help', 'HelpController')
  .otherwise('OtherwiseController')
  //.otherwise( OtherwiseController())

  tg.controller('StartController', (res) => {
    tg.for('start', ($) => {
      //console.log($);
      $.sendMessage('hola ' + $.user.first_name + " gracias por utilizar mislukasbot para empezar puedes con un help ver lo que puedes hacer");
      nombre = $.user.first_name;
      apellido = $.user.last_name;
      idTelegram = $.user.id;
      username = $.user.username;
      var info = JSON.stringify({
        "firstname": nombre,
        "lastname": apellido,
        "username": username,
        "idTelegram": idTelegram
      });
      request.post({
        type: "POST",
        url: 'http://api.minka.io:8082/telegram/registro',
        headers: {
          "content-type" : "application/json"
        },
        body: info,
        dataType: 'json'
      });
    })
  })

tg.controller('SaldoController', (res) => {
  tg.for('saldo', ($) => {
      request.get({
        type: "GET",
        url: 'http://api.minka.io:8082/person/'+$.user.id+'/balance',
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
          $.sendMessage($.user.first_name +" tu saldo en estos momentos es de " + saldo.balance + " LUK");
        }
      });
  })
})

tg.controller('EnviarController', (res) => {
  tg.for('enviar', ($) => {
      var form = {
          valor: {
              q: 'Cuanto vas a enviar',
              error: 'Lo siento, ingresaste un valor incorrecto',
              validator: (input, callback) => {
                  if(input['text']) {
                      callback(true)
                      return
                  }
                  callback(false)
              }
          },
          username: {
              q: 'A cual usuario le vas a enviar',
              error: 'Lo siento, ingresaste un valor incorrecto',
              validator: (input, callback) => {
                  if(input['text']) {
                      callback(true)
                      return
                  }
                  callback(false)
              }
          }
        }
        $.runForm(form, (result) => {
          if(result.username === $.user.username){
            $.sendMessage("No te puedes enviar dinero a ti mismo");
          }else{
            var info = JSON.stringify({
              "idSend": $.user.id,
              "userReceive": result.username,
              "amount": {
                "currency": "45646514",
                "value": result.valor
              }
            });
            console.log(info);
            request.post({
              type: "POST",
              url: 'http://api.minka.io:8082/transfer',
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
                  $.sendMessage('Tu transferencia/pago se realizo con exito.');
                }else{
                  $.sendMessage('Tu transferencia/pago no se pudo procesar');
                }
              });
          }
        })
  })
})

tg.controller('HelpController', ($) => {
  tg.for('help', ($) => {
    $.sendMessage("hola, gracias por contar conmigo\n"+
      "puedes utilizar los siguientes comandos para hablar conmigo\n"+
      "/enviar \t envia dinero a otra cuenta\n"+
      "/saldo \t consulta tu saldo\n"+
      "/help \t menu de comandos\n"+
      "Espero poder ayudarte en todo lo que necesites");
  })
})

tg.controller('OtherwiseController', ($) => {
  $.sendMessage("No logro entenderte, hablame un poco mas neutro y claro por favor.")
})
