var fs = require('fs')
var Tx = require('ethereumjs-tx').Transaction;
var Web3 = require('web3')

var web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545/'))

var originalAmountToBuyWith = '0.007'; // amount wbnb
var bnbAmount = web3.utils.toWei(originalAmountToBuyWith, 'ether');

var targetAccounts = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));

var targetIndex = 0;
var targetAccount = targetAccounts[targetIndex];

console.log(`Buying for ${originalAmountToBuyWith} BNB from pancakeswap for address ${targetAccount.address}`);

var res = buyToken(targetAccounts[targetIndex], bnbAmount, '0x8c98e95983b1e8c8c1c5152c73a8da9ab0aca169'); // token address to buy here
console.log(res);

async function buyToken(targetAccount, amount, tokenAddress) {

    var amountToBuyWith = web3.utils.toHex(amount);
    var privateKey = Buffer.from(targetAccount.privateKey, 'hex')  ;
    var WBNBAddress = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'; // WBNB token address

    var amountOutMin = '100' + Math.random().toString().slice(2,6);
    var pancakeSwapRouterAddress = '0x10ed43c718714eb63d5aa57b78b54704e256024e'; // v2

    var routerAbi = JSON.parse(fs.readFileSync('pancakeabi.json', 'utf-8'));
    var contract = new web3.eth.Contract(routerAbi, pancakeSwapRouterAddress, {from: targetAccount.address});
    var data = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
        web3.utils.toHex(amountOutMin),
        [WBNBAddress,
            tokenAddress],
        targetAccount.address,
        web3.utils.toHex(Math.round(Date.now()/1000)+60*20),
    );

    var count = await web3.eth.getTransactionCount(targetAccount.address);
    var rawTransaction = {
        "from":targetAccount.address,
        "gasPrice":web3.utils.toHex(5000000000),
        "gasLimit":web3.utils.toHex(290000),
        "to":pancakeSwapRouterAddress,
        "value":web3.utils.toHex(amountToBuyWith),
        "data":data.encodeABI(),
        "nonce":web3.utils.toHex(count)
    };

    var transaction = new Tx(rawTransaction);
    transaction.sign(privateKey);

    var result = await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));
    console.log(result)
    return result;
}