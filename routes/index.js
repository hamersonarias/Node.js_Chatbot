var express = require('express');
var ntlk = require('natural');
var shuffle = require('shuffle-array');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');


var router = express.Router();
 
var intents = require('../Libs/intents');
const py = require('../Libs/ExtraFunctions');

var ERROR_THRESHOLD = 0.25;

var words = [], classes = [], documents = [], ignore_words = ['?'];

var train_x, train_y;

//create our training data
var training = new Array();
var output = [];

//model ts
var model;

//init modules and training
Init();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Tensorflow JS' }); 
});

router.post('/ask',function(req,res,next){   
  res.status(200).end(response(req.body.say,req.body.uID,true));
});

function clean_up_sentence(sentence){
  //tokenize the pattern
  sentence_words = nltk.word_tokenize(sentence);
  //stem each word  
  sentence_words = stemwordsD(sentence_words);
  return sentence_words
}

function bow(sentence, words, show_details){
    //tokenize the pattern
    sentence_words = clean_up_sentence(sentence);
    //bag of words
    var bag = new Array(words.length + 1).join('0').split('').map(parseFloat);
    sentence_words.forEach(function(s, i){ 
      words.forEach(function(v, ii){ 
        if(v == s){
          bag[ii] = 1;
          if(show_details){console.log("found in bag: "+w)}
        }
      });
    });
    return bag;       
}

function classify(sentence){
    //generate probabilities from the model
    var results = model.predict(tf.tensor2d([bow(sentence, words)]))[0];
    //filter out predictions below a threshold
    var aux;
    results.forEach(function(s, i){ 
      if(s > ERROR_THRESHOLD){
        aux.push(s);
      }
    });
    results = aux;
    //sort by strength of probability    
    results.sort(function(first, second) {
      return second[1] - first[1];
    }).reverse();

    var return_list = [];
    results.forEach(function(r, i){ 
      return_list.push([classes[r[0]],r[1]]);
    });
    //return tuple of intent and probability
    return return_list
}

function response(sentence,userID,show_details){
  var context = [];
  var pos;
  var results = classify(sentence);  
  //if we have a classification then find the matching intent tag
  if (results){
    //loop as long as there are matches to process
    while (results[i]) {
      intents.forEach(function(s, i){ 
        //set context for this intent if necessary
        if(s.tag == results[0][0]){
           if(py.inArray('context_set',s)){
              pos = context.push({uID:userID, context:s['context_set']}) - 1;
              if (show_details){
                console.log('context: ' +s['context_set'])
              }
            }
           //check if this intent is contextual and applies to this user's conversation
           if(!py.inArray('context_set',s) || !py.NotcontainsinArray(context,userID) &&  py.inArray('context_filter',s) && s['context_filter'] == context[pos].context){
            console.log('tag: ' +s['tag']);
            //a random response from the intent
            return py.randomchoice(s['responses']);
           }
        }
      });     
      results.shift();
      i++;
    }
  }
}

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
  const xs = tf.tensor2d(train_x);
  const ys = tf.tensor2d(train_y);

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

function stemwordsD(words){ 
  return words.map((iten, index, array) => {
    ntlk.LancasterStemmer.attach();
    iten = iten.toLowerCase().stem();
    return iten;
 }) 
}

module.exports = router;
