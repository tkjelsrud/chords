var firstNotSecond;
function CompareIntArrays(arr1, arr2)
{
    firstNotSecond = new Array();

    var arr3 = new Array(); //appear in both
    var arrTemp = new Array(); //used for firstNotSecond
    var usedNumbers = new Array();

    for (var i = 0; i < arr1.length; i++)
    {
        var key = arr1[i];
        usedNumbers[key] = true;
        arrTemp[key + ""] = true;
    }

    for (var i = 0; i < arr2.length; i++)
    {
        var key = arr2[i];
        if (usedNumbers[key])
        {
            arr3[arr3.length] = key;
            arrTemp[key] = false;
        }
    }

    for (var key in arrTemp)
        if (arrTemp[key])
            firstNotSecond[firstNotSecond.length] = parseInt(key);

    return arr3;
}
