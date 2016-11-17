
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


tg.router
  .when('start', 'StartController')
  .when('enviar', 'EnviarController')
  .when('saldo', 'SaldoController')
  .when('help', 'HelpController')
  .when('pagar', 'PagarController')
  .otherwise('OtherwiseController')
  //.otherwise( OtherwiseController())

  tg.controller('StartController', (res) => {
    tg.for('start', ($) => {
      if($.user.username == null){
        $.sendMessage('hola ' + $.user.first_name + " tienes que configurar un username para poder interactuar conmigo luego dale la palabra start.");
      }else{
        var form = {
          phone: {
              q:  'hola ' + $.user.first_name + " bienvenido a mislukasbot, para empezar por favor confirmame tu numero celular",
              error: 'Lo siento, ingresaste un valor incorrecto',
              validator: (input, callback) => {
                  if(input['text']) {
                    request.post({
                      type: "POST",
                      url: 'http://api.minka.io/channel/'+input['text']+"/sendotp",
                      headers: {
                        "content-type": "application/json",
                      },
                      dataType: 'json'
                      }, function(err, response, body){
                        //var datos = JSON.parse(body);
                        if(err){
                          console.log(err)
                        }
                      });
                      callback(true)
                      return
                  }
                  callback(false)
              }
          },
          code: {
              q: 'Ingresa el codigo que te enviamos a tu celular',
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
          var info = JSON.stringify({
            "code": result.code
          });
            request.post({
              type: "POST",
              url: 'http://api.minka.io/channel/'+result.phone+"/verify",
              headers: {
                "content-type": "application/json",
              },
              body: info,
              dataType: 'json'
              }, function(err, response, body){
                console.log("body", body);
                var datos = JSON.parse(body);
                console.log("datos", datos);
                if(err){
                  console.log(err)
                }else if(datos.response){
                  nombre = $.user.first_name;
                  apellido = $.user.last_name;
                  idTelegram = $.user.id;
                  username = $.user.username;
                  telefono = result.phone;
                  var info = JSON.stringify({
                    "channel": [
                      {
                        "type": "telegram",
                        "name": "telegram",
                        "value": idTelegram,
                        "username": username,
                        "notificationId": idTelegram,
                        "status": "verified"
                      },
                      {
                        "type": "phone",
                        "name": "phone",
                        "value": phone,
                        "username": phone,
                        "notificationId": phone,
                        "status": "verified"
                      }
                    ],
                    "properties": [
                      {
                        "name": "firstname",
                        "value": nombre
                      },
                      {
                        "name": "lastname",
                        "value": apellido
                      }
                    ]
                  });
                  request.post({
                    type: "POST",
                    url: 'http://api.minka.io/person',
                    headers: {
                      "content-type" : "application/json"
                    },
                    body: info,
                    dataType: 'json'
                  },function(err, response, body){
                    if(err)
                      console.error(err)
                    $.sendMessage("Listo ahora puedes utilizar todos los servicios de mislukasbot");
                  });
                }else{
                  $.sendMessage('Se presento un error vuelve a intentarlo');
                }
              });
        })
      }
    })
  })

tg.controller('SaldoController', (res) => {
  tg.for('saldo', ($) => {
    if($.user.username == null){
      $.sendMessage('hola ' + $.user.first_name + " tienes que configurar un username para poder interactuar conmigo luego dale la palabra start.");
    }else{
      request.get({
        type: "GET",
        url: 'http://api.minka.io/person/'+$.user.id+'/balance',
        headers: {
          "content-type": "application/json",
        },
        dataType: 'json'
      }, function(err, response, body){
        var datos = JSON.parse(body);
        var saldo = datos.coin;
        if(err){
          console.log(err)
        }else if(datos.coin){
          $.sendMessage($.user.first_name +" tu saldo en estos momentos es de " + saldo.balance + " LUK");
        }
      });
    }
  })
})

tg.controller('EnviarController', (res) => {
  tg.for('enviar', ($) => {
    if($.user.username == null){
      $.sendMessage('hola ' + $.user.first_name + " tienes que configurar un username para poder interactuar conmigo luego dale la palabra start.");
    }else{
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
              "_links": {
               "source": $.user.id,
               "destination": result.username
              },
                "amount": {
                    "currency": "LUK",
                    "value": result.valor
                },
                "metadata": {
                      "description": "enviado desde telegram"
                }
            });
            console.log(info);
            request.post({
              type: "POST",
              url: 'http://api.minka.io/transfer',
              headers: {
                "content-type": "application/json",
              },
              body: info,
              dataType: 'json'
              }, function(err, response, body){
                var datos = JSON.parse(body);
                if(err){
                  console.log(err)
                }else if(datos != null){
                  $.sendMessage('Tu transferencia se realizo con exito.');
                }else{
                  $.sendMessage('Tu transferencia no se pudo procesar');
                }
              });
          }
        })
      }
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

tg.controller('PagarController', ($) => {
  tg.for('pagar', ($) => {
    $.sendMessage($.user.first_name + " se realizo el pago de tu factura de luz por un valor de $6 LUK");
  })
})

tg.controller('OtherwiseController', ($) => {
  $.sendMessage("No logro entenderte, hablame un poco mas neutro y claro por favor.");

})
