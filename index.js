
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
  .when('login', 'LoginController')
  .when('enviar', 'EnviarController')
  .when('saldo', 'SaldoController')
  .when('registro', 'RegistroController')
  .when('help', 'HelpController')
  //.otherwise( OtherwiseController())

  tg.controller('StartController', (res) => {
    tg.for('start', ($) => {
      //console.log($);
      $.sendMessage('hola ' + $.user.first_name + " gracias por utilizar mislukasbot para empezar puedes mirar con el comando /help todo lo que puedes hacer");
      nombre = $.user.first_name;
      apellido = $.user.last_name;
      idTelegram = $.user.id;
      username = $.user.username;
      var info = JSON.stringify({
        "firstname": nombre,
        "lastname": apellido,
        "TelegramUserName": username,
        "telegramId": telegramId
      });
      request.post({
        type: "POST",
        url: 'http://api.minka.io:8081/telegram/registro',
        headers: {
          "content-type" : "application/json"
        },
        body: info,
        dataType: 'json'
      });
    })
  })

  tg.controller('LoginController', (res) => {
    tg.for('login', ($) => {
      var form = {
          codigo: {
              q: 'Escribe tu codigo',
              error: 'Lo siento, ingresaste un valor incorrecto',
              validator: (input, callback) => {
                  if(input['text']) {
                      callback(true)
                      return
                  }
                  callback(false)
              }
          },
          confirmCodigo: {
              q: 'Confirma el codigo',
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
          if(result.codigo != result.confirmCodigo){
            $.sendMessage("los codigos no coinciden vuelve a intentarlo");
            return;
          }
          var info = JSON.stringify({
            "telegramId": $.user.id,
            "code": result.codigo
          });
          request.post({
            type: "POST",
            url: 'http://api.minka.io:8082/telegram/loginMislukas',
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
                $.sendMessage('Gracias ' + nombre  + ' ahora puedes utilizar todos los servicios de mislukasbot');
              }else{
                send = false;
                $.sendMessage(datos.message);
              }
            });
        })
    })
  })

  tg.controller('RegistroController', (res) => {
    tg.for('registro', ($) => {
      var form = {
          phone: {
              q: 'Cual es tu numero de celular',
              error: 'Lo siento, ingresaste un valor incorrecto',
              validator: (input, callback) => {
                  if(input['text']) {
                      callback(true)
                      return
                  }
                  callback(false)
              }
          },
          code: {
              q: 'Ingresa un pin',
              error: 'Lo siento, ingresaste un valor incorrecto',
              validator: (input, callback) => {
                  if(input['text']) {
                      callback(true)
                      return
                  }
                  callback(false)
              }
          },
          confirmPin: {
            q: 'Confirma el pin',
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
          if(result.code != result.confirmPin){
            $.sendMessage("los codigos no coinciden vuelve a intentarlo");
            return;
          }
          nombre = $.user.first_name;
          apellido = $.user.last_name;
          telegramId = $.user.id;
          phone = result.phone;
          code = result.code;
          var info = JSON.stringify({
            "firstname": nombre,
            "lastname": "fdsaf",
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
            }else if(!datos.Person) {
              $.sendMessage($.user.first_name + " te has registrado con exito.");
            }else if(datos.Person){
              $.sendMessage("El usuario ya existe en la app");
            }else{
              $.sendMessage("Algo ha salido mal vuelve a hacer el proceso con el comando /registro");
            }
            });
        })
  })
})
tg.controller('SaldoController', (res) => {
  tg.for('saldo', ($) => {
    if(login == true){
      request.get({
        type: "GET",
        url: 'http://api.minka.io:8082/person/'+minkaId+'/balance',
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
  })
})

tg.controller('EnviarController', (res) => {
  tg.for('enviar', ($) => {
    if(login == true){
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
          telefono: {
              q: 'A cual numero vas a enviar',
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
          if(result.telefono === phone){
            $.sendMessage("No te puedes enviar dinero a ti mismo");
          }else{
            var info = JSON.stringify({
              "phoneSend": phone,
              "phoneReceive": result.telefono,
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
                  $.sendMessage('Tu transferencia/pago se realizo con exito, si quieres ejecuta el comando /saldo y mira como quedo tu saldo');
                }else{
                  $.sendMessage('Tu transferencia/pago no se pudo procesar');
                }
              });
          }
        })
    }else{
      $.sendMessage("Aun no te has logueado y si no me dejas saber quien eres no te puedo ayudar :c, dime quien eres con el comando /login");
    }
  })
})

tg.controller('HelpController', ($) => {
  tg.for('help', ($) => {
    $.sendMessage("hola, gracias por contar conmigo\n"+
      "puedes utilizar los siguientes comandos para hablar conmigo\n"+
      "/registro (:telefono :codigo) \t crea una cuenta en nuestra app\n"+
      "/login (:codigo)\t\t ingresa a la app\n"+
      "/enviar (:telefono :valor)\t envia dinero a otra cuenta\n"+
      "/saldo \t consulta tu saldo\n"+
      "/help \t menu de comandos\n"+
      "Espero poder ayudarte en todo lo que necesites");
  })
})
