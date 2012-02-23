# Doc.js
Document storage and processing via map-reduce.

## Notes
* Documents here means JSON objects with a required id and revision field.

## Usage
* Include this script
* Create a new store:

``` var store = new Doc.store(); ```

* Put some documents in it:

```
store.save({id:123, name:"Aela"});
store.open(123);
store.remove(123);
store.unRemove(123);
```

* Create, run, and view results of map-reduce views on the data. A map function receives each doc, one at a time. A reduce function receives the concatenated results of it's corresponding map function accross all documents:

```
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
```
