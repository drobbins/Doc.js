(function(){

  // Setup Workspace
  var root = this,
      Doc = {} || root.Doc;

  //Utility Functions
  Doc._clone = function _clone(doc){
    return JSON.parse(JSON.stringify(doc));
  };

  // Container for docs
  Doc._docs = {};

  // CRUD for docs
  Doc.save = function save(doc){
    var rev, currentDoc;
    if(Doc._docs[doc.id]){
      currentDoc = Doc._docs[doc.id];
    }
    else {
      currentDoc = Doc._docs[doc.id] = { currentRev : 0 };
    }
    rev = currentDoc.currentRev + 1;
    doc.rev = currentDoc.currentRev = rev;
    Doc._docs[doc.id][rev] = Doc._clone(doc);
    return rev;
  };
  Doc.open = function open(id, rev){
    var doc = Doc._docs[id];
    if (doc.deleted){
      return {deleted:true, lastRev:doc.currentRev};
    }
    if (rev){
      return Doc._clone(doc[rev]);
    }
    return Doc._clone(doc[doc.currentRev]);
  };
  Doc.remove = function remove(id){
    if(Doc._docs[id]){
      Doc._docs[id].deleted = true;
    }
  };
  Doc.removeAll = function removeAll(){
    for (var docId in Doc._docs) { Doc._docs[docId].deleted = true; }
  };
  Doc.dump = function dump(){
    Doc._docs = {};
  };
  // Save to the global object
  root.Doc = Doc;
})();
