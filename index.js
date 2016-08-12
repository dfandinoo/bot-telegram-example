
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

tg.router
  .when('/start', 'StartController')
  .when('/login :code', 'LoginController')
  .when('/enviar :telefono :valor', 'EnviarController')
  .when('/saldo', 'SaldoController')
  .when('/registro :phone :code', 'RegistroController')
  .when('/help', 'help')
  //.otherwise( OtherwiseController())

  tg.controller('StartController', (res) => {
    tg.for('/start', ($) => {
      $.sendMessage('hola ' + $.user.first_name + " gracias por utilizar mislukasbot para empezar puedes mirar con el comando /help todo lo que puedes hacer");
    })
  })

  tg.controller('LoginController', (res) => {
    tg.for('/login :code', ($) => {
      code = $.query.code;
      if(code == null) {
        $.sendMessage('Lo siento no mandaste alguno de los parametros vuelva a intentarlo');
      } else{
        var info = JSON.stringify({
          "telegramId": $.user.id,
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
              $.sendMessage('Gracias ' + nombre  + ' ahora puedes utilizar todos los servicios de mislukasbot');
            }else{
              send = false;
              $.sendMessage(datos.message);
            }
          });
      }
    })
  })

  tg.controller('RegistroController', (res) => {
    tg.for('/registro :phone :code', ($) => {
      nombre = $.user.first_name;
      apellido = $.user.last_name;
      telegramId = $.user.id;
      phone = $.query.phone;
      code = $.query.code;
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
tg.controller('SaldoController', (res) => {
  tg.for('/saldo', ($) => {
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
  })
})

tg.controller('EnviarController', (res) => {
  tg.for('/enviar :telefono :valor', ($) => {
    if(login == true){
      if($.query.telefono === phone){
        $.sendMessage("No te puedes enviar dinero a ti mismo");
      }else{
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
    }else{
      $.sendMessage("Aun no te has logueado y si no me dejas saber quien eres no te puedo ayudar :c, dime quien eres con el comando /login");
    }
  })
})

tg.controller('help', ($) => {
  tg.for('/help', ($) => {
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
