sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/m/MessageToast",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/m/Button",
    "sap/m/Text",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Fragment, Filter, MessageToast, FilterOperator, Dialog, mobileLibrary, Button, Text, formatter) {
        "use strict";
        var that, oGModel;
        // shortcut for sap.m.ButtonType
        var ButtonType = mobileLibrary.ButtonType;

        // shortcut for sap.m.DialogType s
        var DialogType = mobileLibrary.DialogType;
        return Controller.extend("cpapp.vcpcharvaloptpercent.controller.Home", {
            onInit: function () {
                that = this;
                that.oGModel = this.getOwnerComponent().getModel("oGModel");
                that.oTabtModel = new JSONModel();
                that.oCharModel = new JSONModel();
                that.oCharModel.setSizeLimit(5000);
                that.oAlgoListModel = new JSONModel();
                this.prodModel = new JSONModel();
                this.prodModel.setSizeLimit(2000);
                that.getEnable();
            },
            getEnable: function () {
                var oModel = this.getOwnerComponent().getModel("BModel");
                var vUser = this.getUser();
                var oEntry = {
                    USERDATA: []
                }, aResults = [];
                let oParamVals = {
                    USEREMAIL: vUser
                };
                oEntry.USERDATA.push(oParamVals);
                oModel.callFunction("/genUserAppVisibility", {
                    method: "GET",
                    urlParameters: {
                        FLAG: 'G',
                        USERDATA: JSON.stringify(oEntry.USERDATA)
                    },
                    success: function (oData) {
                        aResults = oData.results;
                        if (aResults.length > 0) {
                            var isUserLoggedIn = true;
                        }
                        if (isUserLoggedIn) {
                            if (aResults[0].DELETE_CHK === "disabled") {
                                that.byId("idDelete").setEnabled(false);
                            }
                            if (aResults[0].UPDATE_CHK == "disabled") {
                                that.byId("idEdit").setEnabled(false);
                            }
                            if (aResults[0].CREATE_CHK == "disabled") {
                                that.byId("idAdd").setEnabled(false);
                            }
                        }
                        else {
                            that.byId("idAdd").setEnabled(false);
                            that.byId("idEdit").setEnabled(false);
                            that.byId("idDelete").setEnabled(false);
                        }
                    },
                    error: function (oData, error) {
                        MessageToast.show("error");
                    },
                });
            },
            // get data from userlogin
            getUser: function () {
                var vUser;
                if (sap.ushell.Container) {
                    let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                    vUser = (email) ? email : "";
                }
                return vUser;

            },
            onAfterRendering: function () {
                sap.ui.core.BusyIndicator.show();
                that.loadArray = [], that.uniqueTabNames = [];
                this._oCore = sap.ui.getCore();

                if (!that._onCreateChar) {
                    that._onCreateChar = sap.ui.xmlfragment(
                        "cpapp.vcpcharvaloptpercent.view.Characteristics",
                        that
                    );
                    that.getView().addDependent(that._onCreateChar);
                }

                this.oProdList = this._oCore.byId(
                    that._onCreateChar.getId() + "-list"
                );
                if (!this._valueHelpDialogProd) {
                    this._valueHelpDialogProd = sap.ui.xmlfragment(
                        "cpapp.vcpcharvaloptpercent.view.ProdDialog",
                        this
                    );
                    this.getView().addDependent(this._valueHelpDialogProd);
                }
                this.oProductList = this._oCore.byId(
                    this._valueHelpDialogProd.getId() + "-list"
                );
                // this.getOwnerComponent().getModel("BModel").callFunction("/getProductCharVal", {
                //     method: "GET",
                //     urlParameters: {
                //         Flag: "Z",
                //         PRODATA: JSON.stringify([])
                //     },
                    this.getOwnerComponent().getModel("BModel").read("/getProdClsChar", {
                    success: function (oData) {
                        for (let i = 0; i < oData.results.length; i++) {
                            oData.results[i].CHARVAL_INPUT = "";
                            that.loadArray.push(oData.results[i]);
                        }
                        // let aDistinct = that.removeDuplicate(that.loadArray, 'CHAR_NAME');
                        // that.oCharModel.setData({ setCharacteristics: aDistinct });
                        // sap.ui.getCore().byId("idCharSelect").setModel(that.oCharModel);
                    },
                    error: function () {
                        MessageToast.show("Failed to get characteristics");
                    },
                });
                this.getOwnerComponent().getModel("BModel").read("/getCharValOptPercent", {
                    method: "GET",
                    success: function (oData) {
                        that.totalArray = [];
                        for (var i = 0; i < oData.results.length; i++) {
                            // var filteredData = that.loadArray.find(a => a.CHAR_NUM === oData.results[i].CHAR_NUM && a.CHARVAL_NUM === oData.results[i].CHARVAL_NUM);
                            var filteredData = that.loadArray.find(a => a.CHAR_NUM === oData.results[i].CHAR_NUM && a.CHARVAL_NUM === oData.results[i].CHARVAL_NUM && a.PRODUCT_ID === oData.results[i].PRODUCT_ID);
                            if (filteredData) {
                                filteredData.OPT_PERCENT = oData.results[i].OPT_PERCENT;
                                filteredData.PRODUCT_ID = oData.results[i].PRODUCT_ID;
                                that.totalArray.push(filteredData);
                            }
                        }
                        that.oTabtModel.setData({ setDetails: that.totalArray });
                        that.byId("charList").setModel(that.oTabtModel);
                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("Failed to get opt percentages");
                    },
                });
                that.getOwnerComponent().getModel("BModel").read("/getLocProdDet", {
                    success: function (oData) {
                        that.prodData = that.removeDuplicate(oData.results, 'PRODUCT_ID');
                        that.prodModel.setData({ prodDetails: that.prodData });
                        that.oProductList.setModel(that.prodModel);
                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function (oData, error) {
                        MessageToast.show("error");
                        sap.ui.core.BusyIndicator.hide();
                    },
                });
                that.oGModel.setProperty("/Flag1", "");
                that.oProd = sap.ui.getCore().byId("PDFprodInput");
            },
            handleValueHelp1: function (oEvent) {
                var sId = oEvent.getSource().getId();
                if (sId.includes("PDFprodInput")) {
                    that._valueHelpDialogProd.open();
                }

            },
            onCreate: function () {
                if (!that._onCreate) {
                    that._onCreate = sap.ui.xmlfragment(
                        "cpapp.vcpcharvaloptpercent.view.CreateOptPer",
                        that
                    );
                    that.getView().addDependent(that._onCreate);
                }
                that.charNum = sap.ui.getCore().byId("idCharName");
                that._onCreate.open();
            },
            removeDuplicate(array, key) {
                var check = new Set();
                return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
            },
            handleValueHelp: function () {
                if (sap.ui.getCore().byId("PDFprodInput").getTokens().length > 0) {
                    that._onCreateChar.open();
                }
                else {
                    MessageToast.show("Please select a Configurable Product");
                }

            },
            handleClose: function () {
                if (that.oProdList.getBinding("items")) {
                    that.oProdList.getBinding("items").filter([]);
                }
            },
            onCharCanel: function () {
                var selectedItems = sap.ui.getCore().byId("idCharSelect").getItems();
                for (var i = 0; i < selectedItems.length; i++) {
                    selectedItems[i].setSelected(false);
                }
                if (that.oProdList.getBinding("items")) {
                    that.oProdList.getBinding("items").filter([]);
                }
                that.uniqueTabNames = [];
                that._onCreate.destroy();
                that._onCreate = "";
                that.onAfterRendering();
            },
            handleSearch: function (oEvent) {
                var sQuery =
                    oEvent.getParameter("value") || oEvent.getParameter("newValue"),
                    sId = oEvent.getParameter("id"),
                    oFilters = [];
                // Check if search filter is to be applied
                sQuery = sQuery ? sQuery.trim() : "";
                // Product
                if (sId.includes("idCharSelect")) {
                    if (sQuery !== "") {
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("CHAR_NAME", FilterOperator.Contains, sQuery),
                                    new Filter("CHAR_DESC", FilterOperator.Contains, sQuery)
                                ],
                                and: false,
                            })
                        );
                    }
                    sap.ui.getCore().byId("idCharSelect").getBinding("items").filter(oFilters);
                }
                else if (sId.includes("prodSlctListJS")) {
                    if (sQuery !== "") {
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("PRODUCT_ID", FilterOperator.Contains, sQuery),
                                    new Filter("PROD_DESC", FilterOperator.Contains, sQuery),
                                ],
                                and: false,
                            })
                        );
                    }
                    that.oProductList.getBinding("items").filter(oFilters);
                }
                else if (sId.includes("headSearch")) {
                    if (sQuery !== "") {
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("CHAR_NUM", FilterOperator.Contains, sQuery),
                                    new Filter("CHAR_DESC", FilterOperator.Contains, sQuery),
                                    new Filter("PRODUCT_ID", FilterOperator.Contains, sQuery)
                                ],
                                and: false,
                            })
                        );
                    }
                    that.byId("charList").getBinding("items").filter(oFilters);
                }
            },
            handleProdSelection: function (oEvent) {
                that.finalData = [], that.initialData = {};
                that.oProd = sap.ui.getCore().byId("PDFprodInput");
                var aSelectedProd;
                aSelectedProd = oEvent.getParameter("selectedItems");
                that.oProd.removeAllTokens();
                aSelectedProd.forEach(function (oItem) {
                    that.oProd.addToken(
                        new sap.m.Token({
                            key: oItem.getTitle(),
                            text: oItem.getTitle(),
                            editable: false,

                        })
                    );
                });
                var selectedProd = that.oProd.getTokens()[0].getText();
                that.initialData = {
                    PRODUCT_ID: selectedProd
                }
                that.finalData.push(that.initialData);
                // this.getOwnerComponent().getModel("BModel").callFunction("/getProductCharVal", {
                //     method: "GET",
                //     urlParameters: {
                //         Flag: "X",
                //         PRODATA: JSON.stringify(that.finalData)
                //     },
                //     success: function (oData) {
                //         that.selectedChars = [];
                //         if (oData.results.length > 0) {
                //             for (let i = 0; i < oData.results.length; i++) {
                //                 oData.results[i].CHARVAL_INPUT = "";
                //                 that.loadArray.push(oData.results[i]);
                //             }
                //             let aDistinct = that.removeDuplicate(that.loadArray, 'CHAR_NAME');
                //             that.oCharModel.setData({ setCharacteristics: aDistinct });
                //             sap.ui.getCore().byId("idCharSelect").setModel(that.oCharModel);
                //             that.oAlgoListModel.setData({ setPanel: [] });
                //             sap.ui.getCore().byId("idVBox").setModel(that.oAlgoListModel);
                //             sap.ui.getCore().byId("idCharName").removeAllTokens();
                //             var selectedItems = sap.ui.getCore().byId("idCharSelect").getItems();
                //             for (var i = 0; i < selectedItems.length; i++) {
                //                 selectedItems[i].setSelected(false);
                //             }
                //         }
                //         else {
                //             sap.m.MessageToast.show("No characteristics available for selected product");
                //         }
                //         sap.ui.core.BusyIndicator.hide();
                //     },
                //     error: function (oData, error) {
                //         sap.ui.core.BusyIndicator.hide();
                //         MessageToast.show("error");
                //     },
                // });
                var charData = that.loadArray.filter(a => a.PRODUCT_ID === selectedProd);
                if(charData.length>0){
                    let aDistinct = that.removeDuplicate(charData, 'CHAR_NAME');
                            that.oCharModel.setData({ setCharacteristics: aDistinct });
                            sap.ui.getCore().byId("idCharSelect").setModel(that.oCharModel);
                            that.oAlgoListModel.setData({ setPanel: [] });
                            sap.ui.getCore().byId("idVBox").setModel(that.oAlgoListModel);
                            sap.ui.getCore().byId("idCharName").removeAllTokens();
                            var selectedItems = sap.ui.getCore().byId("idCharSelect").getItems();
                            for (var i = 0; i < selectedItems.length; i++) {
                                selectedItems[i].setSelected(false);
                            }
                }
                else{
                    sap.m.MessageToast.show("No characteristics available for selected product"); 
                }
            },
            handleSelection: function (oEvent) {
                that.sumArray = [];
                that.uniqueName = [];
                that.charNum.removeAllTokens();
                var selectedItem = oEvent.getParameters().selectedItems;
                that.charNum = sap.ui.getCore().byId("idCharName");
                selectedItem.forEach(function (oItem) {
                    that.charNum.addToken(
                        new sap.m.Token({
                            key: oItem.getTitle(),
                            text: oItem.getTitle(),
                            editable: false
                        })
                    );
                });
                sap.ui.getCore().byId("idSaveBtn").setEnabled(false);
                for (var i = 0; i < selectedItem.length; i++) {
                    that.uniqueName.push({
                        PRODUCT_ID:sap.ui.getCore().byId("PDFprodInput").getTokens()[0].getText(),
                        CHAR_NAME: selectedItem[i].getTitle(),
                        child: that.removeDuplicate(that.loadArray.filter(a => a.CHAR_NUM === selectedItem[i].getBindingContext().getObject().CHAR_NUM), 'CHAR_VALUE')
                    });
                    that.uniqueName[i].child.push({
                        CHAR_VALUE: "Total Percentage",
                        FLAG: false,
                        CHARVAL_DESC: "(Sum value to be equal to 100)"
                    });
                }
                that.uniqueTabNames = that.uniqueName;
                that.oAlgoListModel.setData({ setPanel: [] });
                that.oAlgoListModel.setData({ setPanel: that.uniqueName });
                sap.ui.getCore().byId("idVBox").setModel(that.oAlgoListModel);
                sap.ui.getCore().byId("idVBox").setVisible(true);
                if (that.oGModel.getProperty("/Flag1") === "X") {
                    that.onAddition();
                }
            },
            onAddition: function () {
                var count1 = 0;
                var tableItems = sap.ui.getCore().byId("idVBox").getItems();
                for (var k = 0; k < tableItems.length; k++) {
                    var tablePanelItems = tableItems[k].getContent()[0].getItems();
                    this._totalValue1 = 0;
                    for (var l = 0; l < tablePanelItems.length - 1; l++) {
                        var tabInput = tablePanelItems[l].getCells()[1].getValue();
                        var inputValue = parseFloat(tabInput) || 0;
                        this._totalValue1 += inputValue;
                    }
                    tablePanelItems[l].getCells()[1].setValue(this._totalValue1);
                    if (+this._totalValue1 === 100) {
                        tablePanelItems[l].getCells()[1].setValueState("Success");
                        tablePanelItems[l].getCells()[1].setValueStateText("Sum equal to 100")
                    }
                    else if (+this._totalValue1 === 0) {
                        tablePanelItems[l].getCells()[1].setValueState("None");
                    }
                    else {
                        tablePanelItems[l].getCells()[1].setValueState("Error");
                        tablePanelItems[l].getCells()[1].setValueStateText("Sum not equal to 100")
                    }

                }

                for (var s = 0; s < tableItems.length; s++) {
                    var childItems = tableItems[s].getContent()[0].getItems();
                    if (childItems[childItems.length - 1].getCells()[1].getValue() !== "100") {
                        count1++;
                        break;
                    }
                }
                if (count1 === 0) {
                    sap.ui.getCore().byId("idSaveBtn").setEnabled(true);
                }
                else {
                    sap.ui.getCore().byId("idSaveBtn").setEnabled(false);
                }

            },
            onOptEnter: function (oEvent) {
                that.oGModel.setProperty("/Flag1", "X");
                var count = 0;
                var input = oEvent.getSource();
                var inputValue = input.getValue();
                // Use a regular expression to remove non-numeric characters
                var numericValue = inputValue.replace(/[^\d.]/g, '');
                // Update the input value with the cleaned numeric value
                input.setValue(numericValue);
                var tableItems = oEvent.getSource().getParent().getTable().getItems();

                this._totalValue = 0;

                for (var k = 0; k < tableItems.length - 1; k++) {
                    var tabInput = tableItems[k].getCells()[1].getValue();
                    var inputValue = parseFloat(tabInput) || 0;
                    this._totalValue += inputValue;
                }
                tableItems[tableItems.length - 1].getCells()[1].setValue(this._totalValue);
                if (+this._totalValue === 100) {
                    tableItems[tableItems.length - 1].getCells()[1].setValueState("Success");
                    tableItems[tableItems.length - 1].getCells()[1].setValueStateText("Sum equal to 100")
                } else {
                    tableItems[tableItems.length - 1].getCells()[1].setValueState("Error");
                    tableItems[tableItems.length - 1].getCells()[1].setValueStateText("Sum not equal to 100")
                }
                var boxModel = sap.ui.getCore().byId("idVBox").getItems();
                for (var s = 0; s < boxModel.length; s++) {
                    var childItems = boxModel[s].getContent()[0].getItems();
                    if (childItems[childItems.length - 1].getCells()[1].getValue() !== "100") {
                        count++;
                        break;
                    }
                }
                if (count === 0) {
                    sap.ui.getCore().byId("idSaveBtn").setEnabled(true);
                }
                else {
                    sap.ui.getCore().byId("idSaveBtn").setEnabled(false);
                }
                // Use the map method to create a new array with the updated value
                that.uniqueTabNames = that.uniqueTabNames.map(obj =>
                    obj.CHAR_VALUE === oEvent.getSource().getBindingContext().getObject().CHAR_VALUE ? { ...obj, CHARVAL_INPUT: numericValue } : obj
                );

            },
            onNavPress: function () {
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
                    var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    // generate the Hash to display 
                    var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                        target: {
                            semanticObject: "VCPDocument",
                            action: "Display"
                        }
                    })) || "";
                    //Generate a  URL for the second application
                    var url = window.location.href.split('#')[0] + hash;
                    //Navigate to second app
                    sap.m.URLHelper.redirect(url, true);
                }
            },
            onCharSave: function () {
                sap.ui.core.BusyIndicator.show();
                var objectData = {}, objectArray = [];
                var vBoxItems = sap.ui.getCore().byId("idVBox").getItems();
                for (var i = 0; i < vBoxItems.length; i++) {
                    var childItems = vBoxItems[i].getContent()[0].getItems();
                    for (var k = 0; k < childItems.length - 1; k++) {
                        if (childItems[k].getCells()[1].getValue() === "") {
                            var opt_percent = "0";
                        }
                        else {
                            var opt_percent = childItems[k].getCells()[1].getValue();
                        }
                        objectData = {
                            PRODUCT_ID: vBoxItems[i].getHeaderToolbar().getBindingContext().getObject().PRODUCT_ID,
                            CHAR_NUM: childItems[k].getBindingContext().getObject().CHAR_NUM,
                            CHARVAL_NUM: childItems[k].getBindingContext().getObject().CHARVAL_NUM,
                            OPT_PERCENT: opt_percent
                        }
                        objectArray.push(objectData);
                        objectData = {}
                    }
                }
                this.getOwnerComponent().getModel("BModel").callFunction("/postCharOptionPercent", {
                    method: "GET",
                    urlParameters: {
                        CHAROPTPERCENT: JSON.stringify(objectArray)
                    },
                    success: function (oData) {
                        that.byId("charList").removeSelections();
                        sap.m.MessageToast.show("Created Successfully");
                        that.onCharCanel();
                    },
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("error");
                    },
                });
            },
            //**On Click of update button*/
            onUpdate: function () {
                that.uniqueName = [];
                that.selectedUnique = [];
                var uniqueItems = {};
                var selectedItems = that.byId("charList").getSelectedItems();
                if (selectedItems.length > 0) {
                    for (var k = 0; k < selectedItems.length; k++) {
                        uniqueItems = {
                            PRODUCT_ID: selectedItems[k].getCells()[0].getTitle(),
                            CHAR_NAME: selectedItems[k].getCells()[1].getTitle(),
                            CHAR_NUM: selectedItems[k].getCells()[1].getText()
                        }
                        that.selectedUnique.push(uniqueItems);
                        uniqueItems = {};
                    }
                    var distinctItems = that.removeDuplicatesTwo(that.selectedUnique, 'PRODUCT_ID','CHAR_NUM');
                    // var distinctItems = that.removeDuplicate(that.selectedUnique,'CHAR_NUM');
                    // var distinctItems = that.selectedUnique;
                    if (!that._onCreate) {
                        that._onCreate = sap.ui.xmlfragment(
                            "cpapp.vcpcharvaloptpercent.view.CreateOptPer",
                            that
                        );
                        that.getView().addDependent(that._onCreate);
                    }
                    that._onCreate.open();
                    sap.ui.getCore().byId("idLabelText").setVisible(false);
                    sap.ui.getCore().byId("idCharName").setVisible(false);
                    sap.ui.getCore().byId("idProdLabel").setVisible(false);
                    sap.ui.getCore().byId("PDFprodInput").setVisible(false);
                    // sap.ui.getCore().byId("idProdHB").setVisible(true);
                    for (var i = 0; i < distinctItems.length; i++) {
                        that.uniqueName.push({
                            PRODUCT_ID:distinctItems[i].PRODUCT_ID,
                            CHAR_NAME: distinctItems[i].CHAR_NAME,
                            child: that.removeDuplicate(that.loadArray.filter(a => a.CHAR_NUM === distinctItems[i].CHAR_NUM && a.PRODUCT_ID === distinctItems[i].PRODUCT_ID),"CHARVAL_NUM")
                                // && a.PRODUCT_ID === distinctItems[i].PRODUCT_ID)
                        });
                        that.uniqueName[i].child.sort((a, b) => {
                            const charValueA = a.CHAR_VALUE; const charValueB = b.CHAR_VALUE;
                            return charValueA.localeCompare(charValueB, undefined, { sensitivity: 'base' });
                        });
                        that.uniqueName[i].child.push({
                            CHAR_VALUE: "Total Percentage",
                            FLAG: false,
                            CHARVAL_DESC: "(Sum value to be equal to 100)"
                        });
                    }

                    that.oAlgoListModel.setData({ setPanel: that.uniqueName });
                    sap.ui.getCore().byId("idVBox").setModel(that.oAlgoListModel);
                    var vBoxItems = sap.ui.getCore().byId("idVBox").getItems();
                    for (var s = 0; s < that.uniqueName.length; s++) {
                        for (var ii = 0; ii < vBoxItems.length; ii++) {
                            if (that.uniqueName[s].CHAR_NAME === vBoxItems[ii].getBindingContext().getObject().CHAR_NAME 
                            && that.uniqueName[s].PRODUCT_ID === vBoxItems[ii].getHeaderToolbar().getBindingContext().getObject().PRODUCT_ID) {
                                var tableCells = vBoxItems[ii].getContent()[0].getItems();
                                var percentOpt = vBoxItems[ii].getBindingContext().getObject().child;
                                for (var jj = 0; jj < tableCells.length; jj++) {
                                    for (var kk = 0; kk < percentOpt.length; kk++) {
                                        if (tableCells[jj].getCells()[0].getItems()[0].getText().trim() === percentOpt[kk].CHAR_VALUE) {
                                            tableCells[jj].getCells()[1].setValue(percentOpt[kk].OPT_PERCENT);
                                            tableCells[jj].getCells()[1].fireLiveChange();
                                        }

                                    }

                                }
                            }
                        }
                    }
                    sap.ui.getCore().byId("idVBox").setVisible(true);
                }
                else {
                    sap.m.MessageToast.show("No Items selected from table");
                }
            },

            removeDuplicatesTwo:function(arr, field1, field2) {
                const uniqueObjects = [];
              
                arr.forEach((obj) => {
                  // Check if an object with the same values for both fields already exists
                  const exists = uniqueObjects.some((uniqueObj) =>
                    uniqueObj[field1] === obj[field1] && uniqueObj[field2] === obj[field2]
                  );
              
                  // If the object doesn't exist, add it to the uniqueObjects array
                  if (!exists) {
                    uniqueObjects.push(obj);
                  }
                });
              
                return uniqueObjects;
              },
            onTableItemsSelect: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                var selection = oEvent.getParameters().selected;
                var tabItems = that.byId("charList").getItems();
                if (selection === true) {
                    var selectItem = oEvent.getParameters().listItems[0].getCells()[1].getText();
                    var selectProdItem = oEvent.getParameters().listItems[0].getCells()[0].getTitle();
                    for (var i = 0; i < tabItems.length; i++) {
                        if (selectItem === tabItems[i].getCells()[1].getText() 
                        && selectProdItem === tabItems[i].getCells()[0].getTitle() ) {
                            tabItems[i].setSelected(true);
                        }
                    }
                    sap.ui.core.BusyIndicator.hide();
                }
                else {
                    var unselectItem = oEvent.getParameters().listItems[0].getCells()[0].getText();
                    var unSelectProdItem = oEvent.getParameters().listItems[0].getCells()[0].getTitle();
                    for (var i = 0; i < tabItems.length; i++) {
                        if (unselectItem === tabItems[i].getCells()[1].getText() 
                        && unSelectProdItem === tabItems[i].getCells()[0].getTitle()) {
                            tabItems[i].setSelected(false);
                        }
                    }
                    sap.ui.core.BusyIndicator.hide();
                }
            },
            onDelete: function () {

                that.uniqueName1 = [];
                that.selectedUnique1 = [];
                var uniqueItems1 = {};
                var selectedTabItems = that.byId("charList").getSelectedItems();
                if (selectedTabItems.length > 0) {
                    for (var k = 0; k < selectedTabItems.length; k++) {
                        uniqueItems1 = {
                            // CHAR_NAME:selectedTabItems[k].getCells()[0].getTitle(),
                            CHAR_NUM: selectedTabItems[k].getCells()[1].getText(),
                            PRODUCT_ID: selectedTabItems[k].getCells()[0].getTitle()
                        }
                        that.selectedUnique1.push(uniqueItems1);
                        uniqueItems1 = {};
                    }
                    if (!this.oApproveDialog) {
                        this.oApproveDialog = new Dialog({
                            type: DialogType.Message,
                            title: "Confirm",
                            content: new Text({ text: "Do you want to delete the selected characteristic(s)?" }),
                            beginButton: new Button({
                                type: ButtonType.Emphasized,
                                text: "Submit",
                                press: function () {
                                    sap.ui.core.BusyIndicator.show();
                                    var distinctItems1 = that.removeDuplicate(that.selectedUnique1, 'CHAR_NUM');
                                    this.getOwnerComponent().getModel("BModel").callFunction("/postCharOptionPercent", {
                                        method: "GET",
                                        urlParameters: {
                                            CHAROPTPERCENT: JSON.stringify(distinctItems1)
                                        },
                                        success: function (oData) {
                                            sap.m.MessageToast.show("Deletion Successfull");
                                            that.byId("charList").removeSelections();
                                            that.oApproveDialog.close();
                                            that.onAfterRendering();
                                        },
                                        error: function (error) {
                                            sap.ui.core.BusyIndicator.hide();
                                            sap.m.MessageToast.show("Failed to delete");

                                        },
                                    });
                                }.bind(this)
                            }),
                            endButton: new Button({
                                text: "Cancel",
                                press: function () {
                                    this.oApproveDialog.close();
                                }.bind(this)
                            })
                        });
                    }
                    this.oApproveDialog.open();

                }
                else {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageToast.show("Please select atleast one item");
                }
            },
            removeSimilarElements: function (array1, array2) {
                let similarElements = array1.filter(obj1 =>
                    array2.some(obj2 => obj1.CHAR_NAME === obj2.CHAR_NAME)
                );

                // Remove the similar elements from array1
                array1 = array1.filter(obj1 => !similarElements.some(obj2 => obj1.CHAR_NAME === obj2.CHAR_NAME));

                // Add the similar elements to array2
                array2 = array2.concat(similarElements);

                return { array1, array2 };
            }
        });
    });




