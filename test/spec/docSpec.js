describe("doc.js", function(){

  beforeEach(function(){

    var toType = function(obj) {
          return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
        },
        setJasmineMatcherMessage = function(message, matcher_context){
          matcher_context.message = function(){return message;};
        },
        custom_matchers = {};

    custom_matchers.toBeA = function toBeA(expected_type){
      return toType(this.actual) === expected_type;
    };

    custom_matchers.toBeAFunction = function toBeAFunction(){
      return toType(this.actual) === 'function';
    };

    custom_matchers.toBeAObject = function toBeAObject(){
      return toType(this.actual) === 'object';
    };

    custom_matchers.toContainPrefixes = function toContainPrefixes(expected){
      var key;
      for (key in expected){
        if (expected.hasOwnProperty(key) && this.actual[key] !== expected[key]){
          setJasmineMatcherMessage(
              "Expected "+this.actual[key]+" to be "+expected[key]+", with prefix "+key+".",
              this
          );
          return false;
        }
      }
      return true;
    };

    this.addMatchers(custom_matchers);

  });

  it("should place Doc on the global object", function(){
    expect(Doc).toBeAObject();
  });

  it("should allow creation of stores", function(){
    var docstore;
    expect(Doc.Store).toBeAFunction();
    docstore = new Doc.Store();
    expect(docstore).toBeAObject();
  });

  describe("Storing documents in Doc", function(){

    var testDoc, store;

    beforeEach(function(){
      testDoc = { id : "123456789", name : "David", age : 28};
      store = new Doc.Store();
    });

    describe("store CRUD API", function(){
      it("should expose save()", function(){
        expect(store.save).toBeAFunction();
      });
      it("should expose open()", function(){
        expect(store.open).toBeAFunction();
      });
      it("should expose remove()", function(){
        expect(store.remove).toBeAFunction();
      });
      it("should expose unremove()", function(){
        expect(store.unremove).toBeAFunction();
      });
    });

    it("should allow the storage and retrieval of a test document", function(){
      var openedDoc = {};
      store.save(testDoc);
      openedDoc = store.open(testDoc.id);
      expect(JSON.stringify(testDoc)).toBe(JSON.stringify(openedDoc));
    });

    it("should return the current revision number of a document when saved", function(){
      var rev = store.save(testDoc);
      expect(rev).toBe(1);
      rev = store.save(testDoc);
      expect(rev).toBe(2);
    });

    it("should allow deletion of documents", function(){
      store.save(testDoc);
      store.remove(testDoc.id);
      expect(JSON.stringify(store.open(testDoc.id))).toBe(JSON.stringify({deleted:true, lastRev:1}));
    });

    it("should allow undeletion of documents", function(){
      var rev = store.save(testDoc);
      store.remove(testDoc.id);
      store.unremove(testDoc.id);
      testDoc.rev = rev;
      expect(JSON.stringify(store.open(testDoc.id))).toBe(JSON.stringify(testDoc));
    });

    it("should allow retrieval of a particular version of a doc", function(){
      var id = testDoc.id;
      store.save(testDoc);
      testDoc.name = "Fred";
      store.save(testDoc);
      expect(store.open(id, 1).name).toBe("David");
      expect(store.open(id, 2).name).toBe("Fred");
    });


  });

  // TODO
  // get various revisions of a document
  // delete/undelete documents
  // throw appropriate errors
  // persist to mongo, riak, or couch as available
  // test removeAll
});
