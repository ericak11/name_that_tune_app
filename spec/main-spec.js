var main = require("../public/main")
var server = require("../server")


describe("add to score", function () {
  it("should add points to score", function(){
    var score = addToScore(5);
    expect(score).toBe(5);
  });
});
