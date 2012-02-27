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

  it("should allow creation of named stores", function(){
    var docstore = new Doc.Store({name:"test"});
    expect(docstore.name).toBe("test");
  });

  xit("should provide a clone-function function", function(){
    var original = function(a,b){return a+b*a;},
        a = 5,
        b = 231,
        clone = Doc._cloneFunction(original);
    expect(original(a,b)).toBe(clone(a,b));
  });

  var backends = {
        DefaultBackend : null,
        RiakBackend : new Doc.RiakBackend({
            bucket_name : "doctest",
            url : "http://localhost:8091/riak"
        })
      },
      backendName;

  var testBackend = function testBackend(backendName, backend){

    describe("Storing documents in Doc with " + backendName, function(){

      var testDoc, store;

      beforeEach(function(){
        testDoc = { id : "123456789", name : "David", age : 28};
        testDoc2 = { id : "abcdefgh", name : "Alex", age : 53};
        if (backend){
          store = new Doc.Store({ backend : backend });
        }
        else {
          store = new Doc.Store();
        }
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
        var rev1 = store.save(testDoc),
            rev2 = store.save(testDoc);
        expect(rev1).toBeTruthy();
        expect(rev2).toBeTruthy();
        expect(rev1).not.toBe(rev2);
      });

      it("should allow deletion of documents", function(){
        var rev = store.save(testDoc);
        store.remove(testDoc.id);
        expect(JSON.stringify(store.open(testDoc.id))).toBe(JSON.stringify({ deleted : true, lastRev : rev }));
      });

      it("should allow undeletion of documents", function(){
        var rev = store.save(testDoc);
        store.remove(testDoc.id);
        store.unremove(testDoc.id);
        testDoc.rev = rev;
        expect(JSON.stringify(store.open(testDoc.id))).toBe(JSON.stringify(testDoc));
      });

      it("should allow retrieval of a particular version of a doc", function(){
        var id = testDoc.id,
            rev1 = store.save(testDoc),
            rev2;
        testDoc.name = "Fred";
        rev2 = store.save(testDoc);
        expect(store.open(id, rev1).name).toBe("David");
        expect(store.open(id, rev2).name).toBe("Fred");
      });

      it("should allow deletion of all documents", function(){
        var id1 = testDoc.id,
            id2 = testDoc2.id;
        store.save(testDoc);
        store.save(testDoc2);
        store.removeAll();
        expect(JSON.stringify(store.open(id1))).toBe(JSON.stringify({deleted:true, lastRev:1}));
        expect(JSON.stringify(store.open(id2))).toBe(JSON.stringify({deleted:true, lastRev:1}));
      });

      it("should provide number of docs", function(){
        store.save(testDoc);
        store.save(testDoc2);
        store.remove(testDoc2.id);
        expect(store.count()).toBe(1);
        expect(store.countAll()).toBe(2);
        expect(store.countDeleted()).toBe(1);
      });

    });

    describe("Creating Map-Reduce views on a Store with " + backendName, function(){

      var store, testData;

      beforeEach(function(){
        if (backend){
          store = new Doc.Store({ backend : backend });
        }
        else {
          store = new Doc.Store();
        }
        testData = [
          { id : "123456789", name : "David", age : 28, bio: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."},
          { id : "987654321", name : "Alex", age : 36, bio : "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."},
          { id : "132435465", name : "Bade", age : 48, bio : "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc."},
          { id : "abcdefghi", name : "Sean", age : 13, bio : "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}
        ];
        testData.forEach(function(doc){
          store.save(doc);
        });
      });

      it("should allow saving and execution of Map-Reduce views", function(){
        expect(store.count()).toBe(4);
        var map = function(doc){
              var words = doc.bio.split(" "),
                  emits = [];
              words.forEach(function(word){
                emits.push({key:word.toLowerCase(), value:1});
              });
              return emits;
            },
            reduce = function(mapResults){
              var r = {}, count = 1;
              mapResults.forEach(function(kvPair){
                if (r.hasOwnProperty(kvPair.key)) { r[kvPair.key] += 1; }
                else {  r[kvPair.key] = 1; }
              });
              return r;
            };
        store.saveView({id : "wordCount", map : map, reduce : reduce});
        var results = store.viewResults("wordCount");
        expect(results).toBeAObject();
        expect(results.reduceResults.content).toBe(2);
        expect(results.reduceResults.is).toBe(4);
        expect(results.reduceResults.lorem).toBe(12);
        expect(results.reduceResults.ipsum).toBe(10);
      });

    });

  };

  for (backendName in backends){
    testBackend(backendName, backends[backendName]);
  }


});
