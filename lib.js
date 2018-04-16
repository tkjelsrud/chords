function compareNumbers(arr1, arr2) {
    eqArr = new Array();
    for(i = 0; i < Math.min(arr1.length, arr2.length); i++) {
           if(arr2.indexOf(arr1[i]) >= 0)
               eqArr.push(arr1[i]);
    }
    return eqArr;
}
