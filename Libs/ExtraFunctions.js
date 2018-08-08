module.exports = new class SysFunctions {
    constructor() {       
    }
  
    randomchoice(A){
       return A[Math.floor(Math.random() * A.length)];
    }

    inArray(key,A){
        if(A[key] != undefined && A[key] != null && A[key].length > 0){
            return true;
        }
        return false;
    }

    len(A){
        return A.length;
    }

    NotcontainsinArray(A,value) {
        return A.indexOf(value) < 0;
    }

    sort(A){
        var uniqueNames = A.filter(function(item, pos) {
            return A.indexOf(item) == pos;
        });
        return uniqueNames;
    }    

    isNotInArray(value, array) {
        return !array.indexOf(value) > -1;
    }

    NotcontainsinPattern_words(A,B) {
       var otp = false;
      for (var i = 0; i < A.length; i++) {
        for (var ii = 0; ii < B.length; ii++) {
          if(A[i] == B[ii]){
            otp = true;
          }
        }         
      }
      return otp; 
    }

    multiDimensionalUnique(arr) {
        var uniques = [];
        var itemsFound = {};
        for(var i = 0, l = arr.length; i < l; i++) {
            var stringified = JSON.stringify(arr[i]);
            if(itemsFound[stringified]) { continue; }
            uniques.push(arr[i]);
            itemsFound[stringified] = true;
        }
        return uniques;
    }

    stemwords(words){ 
        return words.map((word, index, array) => {
          ntlk.LancasterStemmer.attach();
          word = word.stem();
          return word;
        })
    }

    toOneArray(arrToConvert ){
        var newArr = [];
        for(var i = 0; i < arrToConvert.length; i++){
          newArr = newArr.concat(arrToConvert[i]);
        }
        return newArr;
    }
    
    findRecursive(arr1, toFind) {
       return arr1.find(val => Array.isArray(val) ? findRecursive(val, toFind) : val === toFind) !== undefined;
    }

};
