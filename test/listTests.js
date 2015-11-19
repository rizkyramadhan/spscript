exports.run = function (dao) {
	describe("SPScript.RestDao.lists()", function () {
        var results = null;
        before(function(done){
            dao.lists().then(function(data){
                results = data;
                done();
            });
        });
        it("Should return a promise that resolves to an array of lists", function () {
            results.should.be.an("array");
            results.should.not.be.empty;
        });
        it("Should bring back list info like Title, ItemCount, and ListItemEntityTypeFullName", function () {
            var firstItem = results[0];
            firstItem.should.have.property("Title");
            firstItem.should.have.property("ItemCount");
            firstItem.should.have.property("ListItemEntityTypeFullName");
        });
    });

    describe("SPScript.RestDao.lists(listname)", function () {
        var list = dao.lists("TestList");
        describe("SPScript.RestDao.lists(listname).info()", function () {
            var listInfo = null;
            before(function (done) {
                list.info().then(function (info) {
                    listInfo = info;
                    done();
                });
            });
            it("Should return a promise that resolves to list info", function () {
                listInfo.should.be.an("object");
            });
            it("Should bring back list info like Title, ItemCount, and ListItemEntityTypeFullName", function () {
                listInfo.should.have.property("Title");
                listInfo.should.have.property("ItemCount");
                listInfo.should.have.property("ListItemEntityTypeFullName");
            });
        });

        describe("SPScript.RestDao.lists(listname).getItems()", function () {
            var items = null;
            before(function (done) {
                list.getItems().then(function (results) {
                    items = results;
                    done();
                });
            });

            it("Should return a promise that resolves to an array of items", function () {
                items.should.be.an("array");
                items.should.not.be.empty;
            });
            it("Should return all the items in the list", function (done) {
                list.info().then(function (listInfo) {
                    items.length.should.equal(listInfo.ItemCount);
                    done();
                });
            });
        });

        describe("SPScript.RestDao.lists(listname).getItemById(id)", function () {
            var item = null;
            var validId = -1;
            before(function (done) {
                list.getItems()
                    .then(function (allItems) {
                        validId = allItems[0].Id;
                        return validId;
                    })
                    .then(function (id) {
                        return list.getItemById(id);
                    })
                    .then(function (result) {
                        item = result;
                        done();
                    });
            });
            it("Should return a promise that resolves to a single item", function () {
                item.should.be.an("object");
                item.should.have.property("Title");
            });
            it("Should resolve an item with a matching ID", function () {
                item.should.have.property("Id");
                item.Id.should.equal(validId);
            });
        });

        describe("SPScript.RestDao.lists(listname).getItems(odata) - OData support", function () {
            //Get items where BoolColumn == TRUE
            var odata = "$filter=BoolColumn eq 1";
            var items = null;
            before(function (done) {
                list.getItems(odata).then(function (results) {
                    items = results;
                    done();
                });
            });
            it("Should return a promise that resolves to an array of items", function () {
                items.should.be.an("array");
            });
            it("Should return only items that match the OData params", function () {
                items.forEach(function (item) {
                    item.should.have.property("BoolColumn");
                    item.BoolColumn.should.be.true;
                });
            });
        });

        describe("SPScript.RestDao.lists(listname).findItems(key, value)", function () {
            var matches = null;
            before(function (done) {
                list.findItems("BoolColumn", 1).then(function (results) {
                    matches = results;
                    done();
                });
            });
            it("Should return a promise that resolves to an array of list items", function () {
                matches.should.be.an("array");
                matches.should.not.be.empty;
            });
            it("Should only bring back items the match the key value query", function () {
                matches.forEach(function (item) {
                    item.should.have.property("BoolColumn");
                    item.BoolColumn.should.be.true;
                });
            });
            it("Should support string filters", function (done) {
                var stringValue = "Required data";
                list.findItems("RequiredColumn", stringValue).then(function (items) {
                    items.should.be.an("array");
                    items.should.not.be.empty;
                    items.forEach(function (item) {
                        item.should.have.property("RequiredColumn");
                        item.RequiredColumn.should.equal(stringValue);
                    });
                    done();
                });
            });

            it("Should support number (and bool) filters", function () {
                //first 2 tests test this
                return true;
            });
        });
        describe("SPScript.RestDao.lists(listname).findItem(key, value)", function () {
            var match = null;
            before(function (done) {
                list.findItem("BoolColumn", 1).then(function (result) {
                    match = result;
                    done();
                });
            });
            it("Should resolve to one list item", function () {
                match.should.be.an("object");
            });
            it("Should only bring back an item if it matches the key value query", function () {
                match.should.have.property("BoolColumn");
                match.BoolColumn.should.be.true;
            });
        });

        describe("SPScript.RestDao.lists(listname).addItem()", function () {
        	var newItem = {
        		Title: "Test Created Item",
        		MyColumn: "Inserted from Mocha test",
        		RequiredColumn: "This field is required",
        		BoolColumn: "True"
        	};
        	var insertedItem = null;
        	before(function(done){
        		list.addItem(newItem).then(function(result){
        			insertedItem = result;
        			done();
        		}).fail(function(error){
        			console.log(error);
        			done();
        		});
        	});
            it("Should return a promise that resolves with the new list item", function(){
            	insertedItem.should.not.be.null;
            	insertedItem.should.be.an("object");
            	insertedItem.should.have.property("Id");
            });
            it("Should save the item right away so it can be queried.", function() {
            	list.getItemById(insertedItem.Id).then(function(foundItem){
            		foundItem.should.not.be.null;
            		foundItem.should.have.property("Title");
            		foundItem.Title.should.equal(newItem.Title);
            	});
            });
 			it("Should throw an error if a invalid field is set", function(done) {
            	newItem.InvalidColumn = "test";
            	list.addItem(newItem)
            	.then(function(){
            		//supposed to fail
            		("one").should.equal("two");
            	})
            	.fail(function(xhr, status, msg){
            		console.log(msg);
            		console.log(xhr.responseText);
            		xhr.responseText.should.be.a("string");
            		done();
            	});
            });
        });

        describe("SPScript.RestDao.lists(listname).deleteItem(id)", function() {
        	var itemToDelete = null;
        	before(function(done){
        		list.getItems("$orderby=Id").then(function(items){
        			itemToDelete = items[items.length - 1];
        			return list.deleteItem(itemToDelete.Id);
        		}).then(function(){
        			done();
        		});
        	});
        	it("Should delete that item", function(done) {
        		list.getItemById(itemToDelete.Id)
        			.then(function(){
        				throw "Should have failed because item has been deleted";
        			})
        			.fail(function(){
        				done();
        			});
        	});
        	it("Should reject the promise if the item id can not be found", function(done){
        		list.deleteItem(99999999).then(function(){
        			throw "Should have failed because id doesnt exist";
        		})
        		.fail(function(){
        			done();
        		})
        	});
        });

        describe("SPScript.RestDao.lists(listname).updateItem()", function () {
        	var itemToUpdate = null;
        	var updates = { Title: "Updated Title" };
        	before(function(done){
        		list.getItems("$orderby=Id desc").then(function(items){
        			itemToUpdate = items[items.length - 1];
        			done();
        		});
        	});
            it("Should return a promise", function(done) {
            	list.updateItem(itemToUpdate.Id, updates).then(function(){
            		done();
            	});
            });
            it("Should update only the properties that were passed", function(done){
            	list.getItemById(itemToUpdate.Id).then(function(item){
        			item.should.have.property("Title");
        			item.Title.should.equal(updates.Title);
        			item.should.have.property("RequiredColumn");
        			item.RequiredColumn.should.equal(itemToUpdate.RequiredColumn);
            		done();
            	});
            });
        });


        describe("SPScript.RestDao.lists(listname).permissions()", function () {
            var permissions = null;
            before(function (done) {
                list.permissions().then(function (privs) {
                    permissions = privs;
                    console.log("Permission:");
                    console.log(privs);
                    done();
                });
            });
            it("Should return a promise that resolves to an array of objects", function () {
                permissions.should.be.an("array");
                permissions.should.not.be.empty;
            });
            it("Should return objects that each have a member and a roles array", function () {
                permissions.forEach(function (permission) {
                    permission.should.have.property("member");
                    permission.should.have.property("roles");
                    permission.roles.should.be.an("array");
                });
            });
            it("Should return permission objects that contain member.name, member.login, and member.id", function () {
                permissions.forEach(function (permission) {
                    permission.member.should.have.property("name");
                    permission.member.should.have.property("login");
                    permission.member.should.have.property("id");
                });
            });
            it("Should return permission objects, each with a roles array that has a name and description", function () {
                permissions.forEach(function (permission) {
                    permission.roles.forEach(function (role) {
                        role.should.have.property("name");
                        role.should.have.property("description");
                    });
                });
            });
        });

    });
};