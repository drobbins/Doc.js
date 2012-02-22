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
  Doc._clone = function _clone(doc){
    return JSON.parse(JSON.stringify(doc));
  };

  // Container for docs
  Doc._docs = {};

  // Doc Store Creation
  Doc.Store = function Store(){
    this._docs = {};
  };

  // Add functionality to the Store prototype
  extend(Doc.Store.prototype, {

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
      }
    },

    unremove : function unremove(id){
      var doc = this._docs[id];
      if (doc && doc.deleted) { doc.deleted = false; }
    },

    removeAll : function removeAll(){
      for (var docId in this._docs) { this._docs[docId].deleted = true; }
    },

    dump : function dump(){
      this._docs = {};
    }
  });
  // Save to the global object
  root.Doc = Doc;
})();
