var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
const { graphqlHTTP } = require('express-graphql');
const {
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  graphql,
} = require("graphql");

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
var dbUrl = 'mongodb+srv://admin:admin@cluster0.etit6.mongodb.net/<dbname>?retryWrites=true&w=majority';
var Message = mongoose.model('Message',{
  title : String,
  message : String
})

const PersonType = new GraphQLObjectType({
  name: "Person",
  fields: {
      id: { type: GraphQLID },
      title: { type: GraphQLString },
      message: { type: GraphQLString }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
      name: "Query",
      fields: {
          post: {
              type: GraphQLList(PersonType),
              resolve: (root, args, context, info) => {
                  return Message.find().exec();
              }
          },
          person: {
            type: PersonType,
            args: {
                title: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: (root, args, context, info) => {
                return Message.findOne(args.title).exec();
            }
        }
      }
    
  })
});

app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  }),
);

app.get('/messages', (req, res) => {
  Message.find({},(err, messages)=> {
    res.send(messages);
  })
})
app.post('/delete',(req,res)=>{
  console.log("remove");
  Message.deleteMany({},(err)=>{

  })
})



app.post('/messages', async (req, res) => {
  try{
    var message = new Message(req.body);

    var savedMessage = await message.save()
      console.log('saved');
      io.emit('message', req.body);
      res.sendStatus(200);
  }
  catch (error){
    res.sendStatus(500);
    return console.log('error',error); 
  }
  finally{
    console.log('Message Posted')
  }

})


io.on('connection', () =>{
  console.log('connected!')
})

mongoose.connect(dbUrl ,{ useNewUrlParser: true, useUnifiedTopology: true} ,(err) => {
  if(err){console.log(err);}
  else{console.log("db connect success fully");}
})

var server = http.listen(3000, () => {
  console.log('server is running on port', server.address().port);
});
