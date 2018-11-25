var indexedDB = window.indexedDB || window.webkitIndexedDB ||
    window.mozIndexedDB || window.msIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var db;
var countFiledsOfFormular = '';
const TEXT_TYPE = 0;
const CHECK_BOX_TYPE = 1;
const RADIO_BUTTON_TYPE = 2;

initDb();
var i = 0;
var listElements = [];

//Inicijalizacija baze , kreiraju se 2 tabele za smjestanje formular templatea i formular data
function initDb() {
    var request = indexedDB.open("FormularDB", 1);
    request.onsuccess = function (evt) {
        db = request.result;

    };

    request.onerror = function (evt) {
        console.log("IndexedDB error: " + evt.target.errorCode);
    };

    request.onupgradeneeded = function (evt) {
        var formularTemplate = evt.currentTarget.result.createObjectStore(
            "formular", {
                keyPath: "id",
                autoIncrement: true
            });

        formularTemplate.createIndex("name", "name", {
            unique: false
        });
        formularTemplate.createIndex("listElements", "listElements", {
            unique: true
        });

        var formularData = evt.currentTarget.result.createObjectStore(
            "formularData", {
                keyPath: "id",
                autoIncrement: true
            });

        formularData.createIndex("name", "name", {
            unique: false
        });
        formularData.createIndex("dataOfFormular", "dataOfFormular", {
            unique: true
        });

    };
}

//cita iz baze sve kreirane template formulare
function readFormularTemplate(nameFormular) {
    var transaction = db.transaction("formular", "readwrite");
    var objectStore = transaction.objectStore("formular");
    //prikazuje button za dodavanje novih elemenata na postojeci template
    showAddNewElementButton();
    var request = objectStore.openCursor();
    var findFormular = false;
    request.onsuccess = function (evt) {
        var cursor = evt.target.result;
        if (cursor) {
            if (cursor.value.name == nameFormular) {
                reset();
                console.log("Found in database");
                var formular = cursor.value;
                //mnakon sto procita json iz baze za template formular, slijedi postavljanje input polja i forme na administrator tabu
                showTemplateOfFormular(formular);
                findFormular = true;
            } else {
                cursor.continue();
            }
        } else {
            if (!findFormular) {
                addNewElement();
            }
            console.log("No more entries!");
        }
    };
}

//prikazuje button za dodavanje novog elemnta u formu za kreiranje templatea formulara
function showAddNewElementButton() {
    var button = document.getElementById("addNewElementButton");
    button.style = "display:block;"
}


//kada pronadje template od formulara iscrtava polja na formular tabu
function readFormularAndCreateTemplate(nameFormular) {
    reset();
    var transaction = db.transaction("formular", "readwrite");
    var objectStore = transaction.objectStore("formular");

    var request = objectStore.openCursor();
    var findFormular = false;
    request.onsuccess = function (evt) {
        var cursor = evt.target.result;
        if (cursor) {
            if (cursor.value.name == nameFormular) {
                var formular = cursor.value;
                createTemplate(formular);
            } else {
                cursor.continue();
            }
        } else {
            if (!findFormular) {
                addNewElement();
            }
        }
    };
}

//kreira formu za unos u formular tabu
function createTemplate(formular) {
    var listElements = formular.listElements;
    var teamplate = document.getElementById('template');
    countFiledsOfFormular = listElements.length;
    for (var j = 0; j < listElements.length; j++) {
        var label = listElements[j].name;
        var type = listElements[j].type;
        var labelsForRadioButton = listElements[j].labelsForRadioButton;
        var inputType = '';
        var mandatory = listElements[j].type2;
        var mandatoryType = '';
        var requiredSymbol = '';
        var radioButtonInput = '';
        var numberOfRadioButton = listElements[j].countRadioButton;
        var z = document.createElement('div'); // is a node
        z.style = "margin-top:12px;"
        z.id = "form-" + j;
        if (type == TEXT_TYPE) {
            inputType = 'text';
        }
        if (type == CHECK_BOX_TYPE) {
            inputType = 'checkbox';
        }
        if (mandatory == 1) {
            mandatoryType = 'required';
            requiredSymbol = '*';
        }
        if (type == RADIO_BUTTON_TYPE) {
            inputType = 'radiobutton';
            var checked = '';
            radioButtonInput += '<span class="labelRadioButton">' + label + ' ' + requiredSymbol + '</span> ' + '<div class="radioButtonFormular">';
            for (var o = 0; o < numberOfRadioButton; o++) {
                if (o == 0) {
                    checked = 'checked';
                } else {
                    checked = '';
                }
                radioButtonInput += '<input type="radio"  ' + checked + '>' + ' ' + labelsForRadioButton[o] + '<br>';
            }
            radioButtonInput += '</div>';
        }

        if (mandatory == 2 && type == 0) {
            inputType = 'number';
        }

        if (type == 2) {
            z.innerHTML = radioButtonInput;
            teamplate.appendChild(z);
        } else {
            z.innerHTML = label + ' ' + requiredSymbol + '<input type="' + inputType + '" ' + mandatoryType + ' name="elementName" id="element" class="elementFormular"> ';
            teamplate.appendChild(z);
        }
    }
}

//kreira se novi element (forma) u administrator tabu, kada želimo da dodamo novo polje templateu
function addNewElement() {
    var original = document.getElementById('default');
    var clone = original.cloneNode(true);
    clone.id = 'form-' + ++i;
    clone.style = "display:block";
    original.parentNode.appendChild(clone);
    return clone.id;
}


function chooseTypeOfInput(element) {
    if (element.value == "Radio buttons") {
        var parent = element.parentNode;
        var countOfRadioButton = parent.children[3];
        countOfRadioButton.style = "display:inline-block";
    }
}

function chooseNumberOfRadioButtons(element) {
    var countOfRadioButtons = element.value;
    var parent = element.parentNode.parentNode;
    var labelOfRadioButton = parent.children[4];
    labelOfRadioButton.innerHTML = '';
    for (var i = 0; i < countOfRadioButtons; i++) {
        labelOfRadioButton.innerHTML += '<input type="text" class="radioButtonLabel" placeholder="Radio Button label"><br>';
    }
}

//snima formular template u bazu
function saveFormularTemplate() {
    var templateFormularName = document.getElementById("templateFormularName").value;
    for (var index = 1; index <= i; index++) {
        listElements.push(getValueFromPropertiesForCreatingTemplate(index));
    }
    var transaction = db.transaction("formular", "readwrite");
    var objectStore = transaction.objectStore("formular");
    var request = objectStore.put({
        name: templateFormularName,
        listElements: listElements
    });

    request.onsuccess = function (evt) {
        console.log("Writen in database");
    };
}

function saveFormularData() {
}

//čita izabrane vrijednosti iz forme u administrator tab-u
function getValueFromPropertiesForCreatingTemplate(index) {
    var element = document.getElementById('form-' + index);
    var element = {
        id: i,
        name: getLabelValue(element),
        type: getValueFromListBox(element, 0),
        countRadioButton: getCountOfRadioButton(element),
        type2: getValueFromListBox(element, 2),
        labelsForRadioButton: getLabelsForRadioButton(element)
    };
    return element;
}

//metodi za čitanje izabranih vrijednosti
function getLabelValue(element) {
    return element.getElementsByTagName("input")[0].value;
}

function getValueFromListBox(element, index) {
    return element.getElementsByTagName("select")[index].selectedIndex;
}


function getCountOfRadioButton(element) {
    return element.getElementsByClassName("radioButton")[0].value;
}

function getLabelsForRadioButton(element) {
    var labelsForm = element.getElementsByClassName("radioButtonLabels")[0];
    var numberOfLabels = labelsForm.getElementsByTagName("input").length;
    var labelsOfRadioButtons = [];
    for (var k = 0; k < numberOfLabels; k++) {
        labelsOfRadioButtons.push(labelsForm.getElementsByTagName("input")[k].value);
    }
    return labelsOfRadioButtons;
}

//funkcija za pretragu fromular template u administrator tab-u
function searchFormular() {
    var search = document.getElementsByTagName("input");
    var nameFormularFromSearchBox = search[0].value;
    if (i !== 0) {
        reset();
    }
    readFormularTemplate(nameFormularFromSearchBox);
}

//pretraga formular template u formular tab-u
function readFormularOnSelect(event) {
    var selectList = document.getElementById("selectFormular");
    var searchedFormularName = selectList.value;
    readFormularAndCreateTemplate(searchedFormularName);
    resetFormular();
}

//funkcija za resetovanje forme u administrator tabu, uklanja sve postojece forme koje vidimo na ekranu
function reset() {
    for (var k = 1; k <= i; k++) {
        var element = document.getElementById('form-' + k);
        element.parentNode.removeChild(element);
    }
    listElements = [];
    i = 0;
}

//funkcija za resetovanje forme u formular tabu
function resetFormular() {
    if (countFiledsOfFormular != '') {
        for (var k = 0; k < countFiledsOfFormular; k++) {
            var element = document.getElementById('form-' + k);
            element.parentNode.removeChild(element);
        }
    }
}

//kada se klikne na formular tab (meniu) vrši se čitanje iz baze postojećih formulara i dodavanje u select listu koja se nalazi u formular tabu
function addToSelectList() {
    var transaction = db.transaction("formular", "readwrite");
    var objectStore = transaction.objectStore("formular");
    var selectList = document.getElementById("selectFormular");
    selectList.innerHTML = '<option value="None">None</option>';
    var request = objectStore.openCursor();
    request.onsuccess = function (evt) {
        var cursor = evt.target.result;
        if (cursor) {
            var option = document.createElement("option");
            option.setAttribute("value", cursor.value.name);
            option.text = cursor.value.name;
            selectList.appendChild(option);
            cursor.continue();
        } else {
            console.log("No more entries!");
        }
    }
}

//iscrtava formu u administrator tabu nakon što nadje template u bazi
function showTemplateOfFormular(formular) {
    var listElements = formular.listElements;
    for (var t = 0; t < listElements.length; t++) {
        var formID = addNewElement();
        var element = document.getElementById(formID);
        var input = element.getElementsByClassName("element")
        input[0].value = listElements[t].name;
        var type = listElements[t].type;
        var selectList1 = element.getElementsByClassName("selectBox1")
        selectList1[0].getElementsByTagName("option")[type].selected = 'selected';
        var type2 = listElements[t].type2;

        var selectList2 = element.getElementsByClassName("selectBox2")
        selectList2[0].getElementsByTagName("option")[type2].selected = 'selected';

        var inputRadio = element.getElementsByClassName("radioButton")
        inputRadio[0].value = listElements[t].countRadioButton;
        if (type == 2) {
            var countiInputRadio = element.getElementsByClassName("radio")
            countiInputRadio[0].style = "display:inline-block";
        }
    }
}
//funkcija za itvaranje tabova
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    addToSelectList();
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}
