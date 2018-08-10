var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ntlk = require('natural');
var shuffle = require('shuffle-array');
var np = require('numjs');
const py = require('./Libs/ExtraFunctions');
var arrayContains = require('array-contains');
//var model = require('scikit-learn');
//var pickle = require('pickle');

//intents
var intents = require('./Libs/intents');

const tf = require('@tensorflow/tfjs');

require('@tensorflow/tfjs-node');

var words = [], classes = [], documents = [], ignore_words = ['?'];

var train_x, train_y;

//create our training data
var training = new Array();
var output = [];

//model ts
var model;

//init modules and training
Init();

var indexRouter =  require('./routes/index')(app);
var intentsRouter = require('./routes/intents');

var app = express();

//var pickled;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/intents', intentsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function Init(){
	intents.forEach(function(intent, ii){
		intent.patterns.forEach(function(patterns, i){   
      if(py.isNotInArray(ignore_words,patterns)){  
        //tokenize each word in the sentence
        var tokenizer = new ntlk.WordTokenizer();
        var w = tokenizer.tokenize(patterns.toLowerCase()); 
        //add to our words list
        words.push(w);
        //add to documents in our corpus
        documents.push([w,intent.tag]);
      }
      //add to our classes list
      if(!py.ContainsinArray(classes,intent.tag)){
        classes.push(intent.tag);
      }
		});
  });
  //stem and lower each word and remove duplicates 
  words = py.sort(stemwords(py.multiDimensionalUnique(py.toOneArray(words))));
  classes = py.sort(classes);
  console.log("documents "+ py.len(documents));
  console.log(documents);
  console.log("classes "+py.len(classes));
  console.log(classes);
  console.log("unique stemmed words "+ py.len(words));
  console.log(words);

  TraiBuild();
}

function TraiBuild(){
  console.log(' ');
  console.log('Training...'); 
 
  documents.forEach(function(doc, i){
    //initialize our bag of words
    var bag = [];
    //list of tokenized words for the pattern and stem each word
    var pattern_words = doc[0].map((it, i, A) => {
      ntlk.LancasterStemmer.attach();
      it = it.toLowerCase().stem();
      return it;
    });    
    //create our bag of words array
    words.forEach(function(word, ii){
      if(!py.NotcontainsinArray(pattern_words,word)){
        bag.push(1);
      }else{
        bag.push(0);
      }
    });
    //create an empty array for our output
    //output is a '0' for each tag and '1' for current tag
    var output_row = new Array(classes.length + 1).join('0').split('').map(parseFloat);
    output_row[classes.findIndex(x => x==doc[1])] = 1;    
    training.push([bag, output_row]);
  });
  //shuffle our features and turn into np.array
  training = shuffle(training);

  console.log(training);
  //training = np.array(training);

  //create train and test lists
  train_x = py.pick(training,0);
  train_y = py.pick(training,1);

  // const xs = tf.tensor2d(train_x, [6, 1]);
  // const ys = tf.tensor2d(train_y, [6, 1]);
  const xs = tf.tensor2d(train_x, [6, 1]);
  const ys = tf.tensor2d(train_y, [6, 1]);

  //Build neural network
  model = tf.sequential();
  model.add(tf.layers.dense({inputShape: [4], units: 100}));
  model.add(tf.layers.dense({units: 4}));
  model.compile({loss: 'categoricalCrossentropy', optimizer: 'sgd'});

  model.fit(xs, ys, {epochs: 500}); 
}

function stemwordstwo(words){ 
  return words.map((iten, index, array) => {
    return iten.map((it, i, A) => {
     ntlk.LancasterStemmer.attach();
     it = it.stem();
     return it;
   });    
  }) 
}

function stemwords(words){ 
  return words.map((iten, index, array) => {
    ntlk.LancasterStemmer.attach();
    iten = iten.stem();
    return iten;
 }) 
}

module.exports = app;

