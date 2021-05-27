const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    let tokenId = 6;
    let instance = await StarNotary.deployed();
    await instance.createStar('Yay Star', tokenId, {from: accounts[0]});
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    assert.equal(await instance.name(), 'StarName');
    assert.equal(await instance.symbol(), 'STRN');
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Yay Star');
    
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    let tokenId1 = 7;
    let instance = await StarNotary.deployed();
    await instance.createStar('Star1', tokenId1, {from: accounts[0]});

    let tokenId2 = 8;
    await instance.createStar('Star2', tokenId2, {from: accounts[1]});
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.exchangeStars(tokenId1, tokenId2)
    // 3. Verify that the owners changed
    assert.equal(await instance.ownerOf.call(tokenId1)), 'Star2';
    assert.equal(await instance.ownerOf.call(tokenId2)), 'Star1';
});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    let tokenId = 9;
    let instance = await StarNotary.deployed();
    await instance.createStar('Star9', tokenId, {from: accounts[0]});
    // 2. use the transferStar function implemented in the Smart Contract
    await instance.transferStar(accounts[1], tokenId); 
    // 3. Verify the star owner changed.
    assert.equal(await instance.ownerOf.call(tokenId), accounts[1]); 
});

it('lookUptokenIdToStarInfo test', async() => {pragma solidity >=0.4.24;

//Importing openzeppelin-solidity ERC-721 implemented Standard
import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

// StarNotary Contract declaration inheritance the ERC721 openzeppelin implementation
contract StarNotary is ERC721 {

    // Star data
    struct Star {
        string name;
    }

    // Implement Task 1 Add a name and symbol properties
    string public constant name = 'Solaran';
    string public constant symbol = 'SOL';
    

    // mapping the Star with the Owner Address
    mapping(uint256 => Star) public tokenIdToStarInfo;
    // mapping the TokenId and price
    mapping(uint256 => uint256) public starsForSale;

    
    // Create Star using the Struct
    function createStar(string memory _name, uint256 _tokenId) public { // Passing the name and tokenId as a parameters
        Star memory newStar = Star(_name); // Star is an struct so we are creating a new Star
        tokenIdToStarInfo[_tokenId] = newStar; // Creating in memory the Star -> tokenId mapping
        _mint(msg.sender, _tokenId); // _mint assign the the star with _tokenId to the sender address (ownership)
    }

    // Putting an Star for sale (Adding the star tokenid into the mapping starsForSale, first verify that the sender is the owner)
    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == msg.sender, "You can't sell a star you don't own.");
        starsForSale[_tokenId] = _price;
    }


    // Function that allows you to convert an address into a payable address
    function _make_payable(address x) internal pure returns (address payable) {
        return address(uint160(x));
    }

    function buyStar(uint256 _tokenId) public  payable {
        require(starsForSale[_tokenId] > 0, "The star should be up for sale.");
        uint256 starCost = starsForSale[_tokenId];
        address ownerAddress = ownerOf(_tokenId);
        require(msg.value > starCost, "You need to have enough Ether.");
        _transferFrom(ownerAddress, msg.sender, _tokenId); // We can't use _addTokenTo or_removeTokenFrom functions, now we have to use _transferFrom
        address payable ownerAddressPayable = _make_payable(ownerAddress); // We need to make this conversion to be able to use transfer() function to transfer ethers
        ownerAddressPayable.transfer(starCost);
        if(msg.value > starCost) {
            msg.sender.transfer(msg.value - starCost);
        }
    }

    // Implement Task 1 lookUptokenIdToStarInfo
    function lookUptokenIdToStarInfo (uint _tokenId) public view returns (string memory) {
        //1. You should return the Star saved in tokenIdToStarInfo mapping
        return tokenIdToStarInfo[_tokenId].name;
    }

    // Implement Task 1 Exchange Stars function
    function exchangeStars(uint256 _tokenId1, uint256 _tokenId2) public {
        //1. Passing to star tokenId you will need to check if the owner of _tokenId1 or _tokenId2 is the sender
        address owner1 = ownerOf(_tokenId1);
        address owner2 = ownerOf(_tokenId2);
        require(owner1 == msg.sender || owner2 == msg.sender, "You must own one of the two stars.");
        //2. You don't have to check for the price of the token (star)
        //3. Get the owner of the two tokens (ownerOf(_tokenId1), ownerOf(_tokenId1)
        //4. Use _transferFrom function to exchange the tokens.
        if (owner1 == msg.sender) {
            approve(owner2, _tokenId1);
            _transferFrom(owner1, owner2, _tokenId1);
            _transferFrom(owner2, owner1, _tokenId2);
        } else {
            approve(owner1, _tokenId2);
            _transferFrom(owner2, owner1, _tokenId2);
            _transferFrom(owner1, owner2, _tokenId1);
        }
    }

    // Implement Task 1 Transfer Stars
    function transferStar(address _to, uint256 _tokenId) public {
        //1. Check if the sender is the ownerOf(_tokenId)
        address ownerAddress = ownerOf(_tokenId);
        require(ownerAddress == msg.sender, "You can't transfer a star you don't own.");
        //2. Use the transferFrom(from, to, tokenId); function to transfer the Star
        _transferFrom(ownerAddress, _to, _tokenId);
    }

}
    // 1. create a Star with different tokenId
    let tokenId = 10;
    let instance = await StarNotary.deployed();
    await instance.createStar('Star10', tokenId, {from: accounts[0]});
    // 2. Call your method lookUptokenIdToStarInfo
    await instance.lookUptokenIdToStarInfo(tokenId); 
    // 3. Verify if you Star name is the same
    assert.equal(await instance.name(), 'Star10');
});