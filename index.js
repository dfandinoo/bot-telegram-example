
var tg = require('telegram-node-bot')('204461749:AAGR26f_2eN3nAwekbDMuY1zkQfHHptoPl0');
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var store = require('store');
var ls = require('local-storage');

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
  .when('historial', 'HistorialController')
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
                    var code = Math.floor( Math.random() * (10000-999 + 1) + 999 );
                    ls.set('codigo', code);
                    ls.set('telefono', input['text']);
                    var message = "tu codigo de verificacion para mislukasbot es " + code;
                    var telefono = ls.get('telefono');
                    sendSms(message,telefono,function(err, data){
                      if(err){
                        console.log(err)
                      console.log(data);
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
          if(result.code != ls.get('codigo')){
            $.sendMessage('Lo sentimos el codigo no concuerda vuelve a intentarlo');
            ls.remove('telefono');
            ls.remove('codigo');
          }else{
            nombre = $.user.first_name;
            apellido = $.user.last_name;
            idTelegram = $.user.id;
            username = $.user.username;
            telefono = result.phone;
            ls.remove('telefono');
            ls.remove('codigo');
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
                  "value": telefono,
                  "username": telefono,
                  "notificationId": telefono,
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
            requestApi('http://api.minka.io/person',"POST",info,function(err, responde, body){
              if(err)
                console.error(err);
              $.sendMessage("Listo ahora puedes utilizar todos los servicios de mislukasbot");
            });
          }
        })
      }
    })
  })

tg.controller('SaldoController', (res) => {
  tg.for('saldo', ($) => {
    if($.user.username == null){
      $.sendMessage('hola ' + $.user.first_name + " tienes que configurar un username para poder interactuar conmigo luego dale la palabra start.");
    }else{
      requestApi('http://api.minka.io/person/'+$.user.id+'/balance',"GET","", function(err, responde, body){
        var datos = JSON.parse(body);
        var saldo = datos.coin;
        if(err)
          console.error(err);
        if(datos.coin){
          $.sendMessage($.user.first_name +" tu saldo en estos momentos es de " + saldo.balance + " LUK");
        }
      });
    }
  })
})

tg.controller('EnviarController', (res) => {
  tg.for('enviar', ($) => {
    traerDatos($.user.id);
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
                    var code = Math.floor( Math.random() * (10000-999 + 1) + 999 );
                    var message = "tu codigo de verificacion para hacer el envio de dinero en mislukas es " + code;
                    var telefono = ls.get('telefono');
                    ls.set('codigo', code);
                    sendSms(message,telefono,function(err, data){
                      if(err){
                        console.log(err)
                      console.log(data);
                      }
                    });
                      callback(true)
                      return
                  }
                  callback(false)
              }
          },
          code: {
              q: 'Por favor ingresa el codigo que te enviamos a tu celular',
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
          }else if(result.code == ls.get('codigo')){
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
            requestApi("http://api.minka.io/transfer","POST","", function(err, responde, body){
              if(err)
                console.error(err);
              ls.remove('codigo');
              $.sendMessage("Tu transferencia se realizo con exito!");
            })
          }else{
            $.sendMessage("El codigo no coincide lo siento, vuelve a intentarlo");
          }
        })
      }
  })
})

tg.controller('HistorialController', (res) => {
  tg.for('historial', ($) => {
    if($.user.username == null){
      $.sendMessage('hola ' + $.user.first_name + " tienes que configurar un username para poder interactuar conmigo luego dale la palabra start.");
    }else{
      requestApi('http://api.minka.io/transfer/'+$.user.id,"GET","", function(err, responde, body){
        if(err)
          console.error(err);
        var cuerpo = JSON.parse(body);
        var array = Object.keys(cuerpo).map(function (key) {
              console.log(cuerpo[key]._links.destination);
              $.sendMessage('Enviaste '+ cuerpo[key].amount.value + ' LUK a ' + cuerpo[key]._links.destination)
         });
      });
    }
  })
})

tg.controller('HelpController', ($) => {
  tg.for('help', ($) => {
    // traerDatos($.user.id);
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
});

tg.controller('OtherwiseController', ($) => {
  $.sendMessage("No logro entenderte, hablame un poco mas neutro y claro por favor.");

});


function traerDatos(idTelegram,callback){
  requestApi("http://api.minka.io/person/"+idTelegram,"GET","",function(err,response, body){
    var cuerpo = JSON.parse(body);
    var array = Object.keys(cuerpo).map(function (key) {
      if(key === "channel"){
          cuerpo[key].map(function(val){
            if(val.type === "phone"){
              ls.set('telefono',val.value);
              console.log(ls.get('telefono'));
            }
          });
      }
     });
  });
}

function requestApi(http,method,data,callback){
  request({
    method: method,
    url: http,
    headers: {
      "content-type": "application/json",
    },
    body: data || "",
    dataType: 'json'
    },function(err,response,body){
      callback(err,response,body);
    });
}

function sendSms(message, phone, callback) {
    var info = JSON.stringify({
	        "from": "Minka",
	        "to": "57"+phone,
	        "text": message
	      });
        request.post({
          type: "POST",
          url: 'https://api.infobip.com/sms/1/text/single',
          headers: {
            //"authorization": "Basic RGFNaW5rZTIxOlhsczhzbXMyMg==",
            "authorization": "Basic UGxheU1pbmsyMTpYbHM4c21zMzQ=",
            "content-type": "application/json",
          },
          body: info,
          dataType: 'json'
        }, function(err, data){
          callback(err, data);
        });
}
