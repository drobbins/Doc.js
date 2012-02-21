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

  describe("Storing documents in Doc", function(){

    var testDoc;

    beforeEach(function(){
      testDoc = { id : "123456789", name : "David", age : 28};
      Doc.dump();
    });

    describe("Doc CRUD API", function(){
      it("should expose doc.save()", function(){
        expect(Doc.save).toBeAFunction();
      });
      it("should expose doc.open()", function(){
        expect(Doc.open).toBeAFunction();
      });
      it("should expose doc.remove()", function(){
        expect(Doc.remove).toBeAFunction();
      });
    });

    it("should allow the storage and retrieval of a test document", function(){
      var openedDoc = {};
      Doc.save(testDoc);
      openedDoc = Doc.open(testDoc.id);
      expect(JSON.stringify(testDoc)).toBe(JSON.stringify(openedDoc));
    });

    it("should return the current revision number of a document when saved", function(){
      var rev = Doc.save(testDoc);
      expect(rev).toBe(1);
      rev = Doc.save(testDoc);
      expect(rev).toBe(2);
    });

    it("should allow deletion of documents", function(){
      Doc.save(testDoc);
      Doc.remove(testDoc.id);
      expect(JSON.stringify(Doc.open(testDoc.id))).toBe(JSON.stringify({deleted:true, lastRev:1}));
    });

    it("should allow retrieval of a particular version of a doc", function(){
      var id = testDoc.id;
      Doc.save(testDoc);
      testDoc.name = "Fred";
      Doc.save(testDoc);
      expect(Doc.open(id, 1).name).toBe("David");
      expect(Doc.open(id, 2).name).toBe("Fred");
    });


  });

  // TODO
  // get various revisions of a document
  // delete/undelete documents
  // throw appropriate errors
  // persist to mongo, riak, or couch as available
  // test removeAll
});
