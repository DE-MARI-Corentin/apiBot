const { exception } = require('console');
const port_nodejs = 3201;
const express = require('express');
const app = express();
var path = require('path');
const moment = require('moment');

const xml2js = require('xml2js');
const fs = require('fs');
const parser = new xml2js.Parser({ attrkey: "ATTR" });

var dsnMongoDB = "";
let xml_string = fs.readFileSync("credentials.xml", "utf8");

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json({limit:'10mb'}));



const MongoClient = require('mongodb').MongoClient; 
var Quizz = new Object();
var Question = new Object();
var Theme = new Object();
var Reponse = new Object();
const {ObjectId} = require('mongodb');
const { request } = require('http');
const { response } = require('express');



started();

const client = new MongoClient(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

bddLogin();

function getXMLData(enterKey) {
    var res = "";
    parser.parseString(xml_string, function (error, result) {
        if (error === null) {
            result.lstCredentials.Credential.forEach(r => {
                if (r.Name[0] === enterKey) res = r.aws[0];
            });
        }
        else console.log(error);
    });
    return res;
}

function started() {
    dsnMongoDB = getXMLData("UrlMongoDb");
}

function bddLogin() {
    client.connect(err => {
        if (err) console.log(err.stack);
        else console.log("Connecté à la bdd mongodb");
    });
}

var __dirname = "/";


console.log(__dirname);

/*app.get('/login', (req, res) => {
	var p1 = req.query.username;
	var p2 = req.query.password;
    console.log(`go to : http://pedago.univ-avignon.fr:${port_nodejs}/login`);
    console.log(p1+' '+p2);
    res.send("log recu !");
});*/

var server = app.listen(port_nodejs, () => {
	console.log(port_nodejs);
  console.log(`Server running at http://192.168.1.96:${port_nodejs}/`);
});

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});





app.get('/member/list/:nom', (request, response)=>{
    var nom = request.params.nom;
    var list = new Object();
    const collection = client.db("syndrom").collection("persos");
    collection.findOne({ $or: [{ main_pseudo: nom.toLowerCase() }, { main_nom: nom.toLowerCase() }] }).then(result => {
        if (result != null) {
            var i = 0;
            result.mules.forEach(element => {
                list[i] = element;
                i++;
            });
            console.log(list);
            response.send(list);
        }
    });

});

app.get('/member/main/:nom', (request, response)=> {
    var nom = request.params.nom;
    const collection = client.db("syndrom").collection("persos");
    collection.findOne({ "mules.nom": nom.toLowerCase() }).then(result => {
        if (result != null) {
            var res = new Object();
            console.log(result);
            //res = result;
            res.main_pseudo = result.main_pseudo; 
            res.main_nom = result.main_nom;
            response.send(res);
        }
    });
});


app.get('/member/time/:nom', (request, response)=> {
    var nom = request.params.nom;
    const collection = client.db("syndrom").collection("persos");
    collection.findOne({ $or: [{ main_pseudo: nom.toLowerCase() }, { main_nom: nom.toLowerCase() }] }).then(result => {
        if (result != null) {
            let dt = result.dateEnter;
            let now = moment().format("DD-MM-YYYY");
            moment.locale('fr');
            var res = new Object();
            res.timeDif = moment(result.dateEnter,"DD-MM-YYYY").fromNow();
            console.log(res);
            response.send(res);
        }
    });
});

app.get('/member/search/:filter?', (request, response)=> {
    if(request.params.filter == null) var filter = {};
    else var filter = {main_nom: { $regex: "^" + request.params.filter.toLowerCase() }};
    var list = new Object();
    const collection = client.db("syndrom").collection("persos");
    collection.find(filter).toArray(function (err, result) {
        if (err) throw err;
        if (result.length != 0) {
            var i = 0;
            result.forEach(element => {
                list[i] = element;
                i++;
            });
            console.log(list);
            response.send(list);
        }
    });
});


/*
app.get('/play/choixTheme',(request,response)=>{
    const rand = [];
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("quizz").distinct("thème",{}).then(res => {
                if (res != null) {
                    var random;
                    while(rand.length != 3){
                        random = Math.floor(Math.random() * Math.floor(res.length));
                        if(!rand.includes(random)) rand.push(random);
                    }
                    for(i = 0; i < rand.length;i++){
                        Theme[i] = res[rand[i]];
                    }
                }    
                console.log(Theme);     
                response.send(Theme);
             })
            .catch(err => console.log('erreur requete mongodb'));
        }
    });
});

/*
app.get('/play/:theme/:niv',(request,response)=>{
    var niveau = request.params.niv;
    var theme = request.params.theme;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("quizz").find({thème: theme}, {projection:{_id:0, thème: 1, quizz: 2}}).toArray(function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                if (res != null) {
                    Quizz = res;
                }
                response.send(Quizz);
            });
        }
    });
});

app.get('/play/:theme/:niv/:numero',(request,response)=>{
    var niveau = request.params.niv;
    var theme = request.params.theme;
    var _id = request.params.numero;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("quizz").find({thème: theme}, {projection:{_id:0, thème: 1, quizz: 2}}).toArray(function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                if (res != null) {
                    Question.question = res[0].quizz[_id-1].question;
                    var propositions = res[0].quizz[_id-1].propositions;
                    var answer = res[0].quizz[_id-1].réponse;
                    const lstprop = [];
                    lstprop.push(answer);
                    while(lstprop.length != parseInt(niveau,'10')){
                        var random = Math.floor(Math.random() * Math.floor(propositions.length));
                        if(!lstprop.includes(propositions[random])) lstprop.push(propositions[random]);
                    }
                    //permet de ne pas toujours avoir la bonne réponse en premier
                    for (var i = lstprop.length - 1; i > 0; i--) {
                        var j = Math.floor(Math.random() * (i + 1));
                        var temp = lstprop[i];
                        lstprop[i] = lstprop[j];
                        lstprop[j] = temp;
                    }
                    Question.propositions = lstprop;
                    console.log(Question);
                }
                response.send(Question);
            });
        }
    });
});

app.get('/answer/:theme/:niv/:numero',(request,response)=>{
    var niveau = request.params.niv;
    var theme = request.params.theme;
    var _id = request.params.numero;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("quizz").find({thème: theme}, {projection:{_id:0, thème: 1, quizz: 2}}).toArray(function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                if (res != null) {
                    Reponse.anecdote = res[0].quizz[_id-1].anecdote;
                    Reponse.reponse = res[0].quizz[_id-1].réponse;
                }
                console.log(Reponse);
                response.send(Reponse);
            });
        }
    });
});

app.post('/defi/new',(req,response)=>{
    var idDefiant = req.body.idDefiant;
    var idDefie = req.body.idDefie;
    var quizz = req.body.quizz;
    var score = req.body.score;
    var theme = req.body.theme;
    var niveau = req.body.niveau;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            const result = mongoClient.db().collection("defi").insertOne({id_user_defiant: idDefiant, id_user_defie: idDefie, score_user_defiant: score, quizz: quizz, theme: theme, niveau: niveau, idDev: 12});
            response.send(result.insertedCount);
        }
    });
});

app.get('/defi/:idUser',(request,response)=>{
    var idUser = request.params.idUser;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("defi").find({id_user_defie: parseInt(idUser), idDev: 12}).toArray(function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                console.log(res);
                response.send(res);
            });
        }
    });
});

app.get('/remove/defi/:id',(request,response)=>{
    var id = request.params.id;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("defi").deleteOne({_id: ObjectId(id)},function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                response.send(res);
            });
        }
    });
});
*/

/*const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
      origins: ['http://pedago.univ-avignon.fr:'+ port_nodejs]
    }
  });
//var io = require('socket.io').listen(server);
io.on('connection', (socket) => {
    console.log('a user connected');
  });
*/
//app.use(express.static(__dirname +'/etape0/'));

// ps -ef | grep nodejs
//kill -9 nodejs

//sudo kill `sudo lsof -t -i:3202`
