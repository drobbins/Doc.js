(function(){

  // Setup Workspace
  var root = this,
      Doc = {} || root.Doc,
      extend = function extend(obj, source){
        for (var prop in source){
          obj[prop] = source[prop];
        }
      };

  //Utility Functions
  Doc._clone = function _clone(original){
    return JSON.parse(JSON.stringify(original));
  };
  Doc._cloneFunction = function _clone(original){
    return original.bind({});
  };
  Doc._ajax = function _ajax(url, settings){
    try {
      $.ajax(url, settings);
    }
    catch (e){
      throw "jQuery required for AJAX based backends";
    }
  };

  // Container for docs
  Doc._docs = {};

  // Doc Store Creation
  Doc.Store = function Store(options){
    var opt = options || {};
    this.name = opt.name || "";
    if (!opt.backend){
      extend(this, new Doc.DefaultBackend());
    }
    else {
      extend(this, opt.backend);
    }
  };

  // Backend Definitions
  Doc.DefaultBackend = function DefaultBackend(){
    extend(this, {

      // Properties
      _docs : {},
      _views : {},
      _count : 0,
      _countDeleted : 0,

      // Methods
      save : function save(doc){
        var rev, currentDoc;
        if(this._docs[doc.id]){
          currentDoc = this._docs[doc.id];
        }
        else {
          currentDoc = this._docs[doc.id] = { currentRev : 0 };
        }
        rev = currentDoc.currentRev + 1;
        doc.rev = currentDoc.currentRev = rev;
        this._docs[doc.id][rev] = Doc._clone(doc);
        this._count += 1;
        return rev;
      },

      open : function open(id, rev){
        var doc = this._docs[id];
        if (doc.deleted){
          return {deleted:true, lastRev:doc.currentRev};
        }
        if (rev){
          return Doc._clone(doc[rev]);
        }
        return Doc._clone(doc[doc.currentRev]);
      },

      remove : function remove(id){
        if(this._docs[id]){
          this._docs[id].deleted = true;
          this._count -= 1;
          this._countDeleted += 1;
        }
      },

      unremove : function unremove(id){
        var doc = this._docs[id];
        if (doc && doc.deleted) {
          doc.deleted = false;
          this._count += 1;
          this._countDeleted -= 1;
        }
      },

      removeAll : function removeAll(){
        for (var docId in this._docs) {
          this._docs[docId].deleted = true;
          this._countDeleted += this._count;
          this._count = 0;
        }
      },

      dump : function dump(){
        this._docs = {};
      },

      count : function count(){
        return this._count;
      },

      countDeleted : function countDeleted(){
        return this._countDeleted;
      },

      countAll : function countAll(){
        return this._count + this._countDeleted;
      },

      saveView : function saveView(view){
        this._views[view.id] = view;
        this.runView(view.id);
      },

      runView : function runView(id){
        var mapResults = [], reduceResults = [], view, docId;
        if ((this._views).hasOwnProperty(id)){
          view = this._views[id];
          for (docId in this._docs){
            mapResults = mapResults.concat(view.map(this.open(docId)));
          }
          view.mapResults = mapResults;
          view.reduceResults = reduceResults = view.reduce(mapResults);
          return view;
        }
      },

      viewResults : function viewResults(id){
        if ((this._views).hasOwnProperty(id)){
          return this._views[id];
        }
      }

    });
  };

  Doc.RiakBackend = function RiakBackend(options){
    var opt = options || {};
    extend(this, {

      // Properties
      bucket : opt.bucket_name || opt.name || "DocStore",
      url : opt.url,

      // Methods
      save : function save(doc, callback){
        var rev;
        Doc._ajax(this.url + this.bucket, {
          type : "POST",
          data : JSON.stringify(doc),
          contentType : "application/json",
          success : function(response){
            debugger;
            if (callback && typeof callback === "function"){
              callback(response);
            }
            else{
              rev = response;
              return rev;
            }
          }
        });
      },
      open : function open(){},
      remove : function remove(){},
      removeAll : function removeAll(){},
      unremove : function unremove(){},
      dump : function dump(){},
      count : function count(){},
      countAll : function countAll(){},
      countDeleted : function countDeleted(){}
    });
  };


  // Save to the global object
  root.Doc = Doc;
})();
