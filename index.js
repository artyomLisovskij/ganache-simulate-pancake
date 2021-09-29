var fs = require('fs')
var Tx = require('ethereumjs-tx').Transaction;
var Web3 = require('web3')
const common = require('ethereumjs-common');

// var web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545/'))
var web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545/'))

const chain = common.default.forCustomChain(
    'mainnet',{
        name: 'bnb',
        networkId: 97,
        chainId: 97
    },
    'petersburg'
);

var originalAmountToBuyWith = '0.01'; // amount wbnb
var bnbAmount = web3.utils.toWei(originalAmountToBuyWith, 'ether');

var targetAccounts = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));

var targetIndex = 0;
var targetAccount = targetAccounts[targetIndex];

console.log(`Buying for ${originalAmountToBuyWith} BNB from pancakeswap for address ${targetAccount.address}`);

var res = buyToken(targetAccounts[targetIndex], bnbAmount, '0xa7568f58adbf2f95d1222dbb248ab910524a7301'); // token address to buy here
console.log(res);

async function buyToken(targetAccount, amount, tokenAddress) {

    var amountToBuyWith = web3.utils.toHex(amount);
    var privateKey = Buffer.from(targetAccount.privateKey, 'hex');
    var WBNBAddress = '0xae13d989dac2f0debff460ac112a837c89baa7cd'; // WBNB token address

    var amountOutMin = 0;
    var pancakeSwapRouterAddress = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3'; // v2

    var routerAbi = JSON.parse(fs.readFileSync('pancakeabi.json', 'utf-8'));
    var contract = new web3.eth.Contract(routerAbi, pancakeSwapRouterAddress, {from: targetAccount.address});
    var data = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
        web3.utils.toHex(amountOutMin),
        [WBNBAddress,
            tokenAddress],
        targetAccount.address,
        web3.utils.toHex(Math.round(Date.now()/1000)+60*20),
    );
    
    let minABI = [
        // balanceOf
        {
            "constant":true,
            "inputs":[{"name":"_owner","type":"address"}],
            "name":"balanceOf",
            "outputs":[{"name":"balance","type":"uint256"}],
            "type":"function"
        },
        // decimals
        {
            "constant":true,
            "inputs":[],
            "name":"decimals",
            "outputs":[{"name":"","type":"uint8"}],
            "type":"function"
        }
    ];
    let tokenContract = new web3.eth.Contract(minABI,tokenAddress);
    var count = await web3.eth.getTransactionCount(targetAccount.address);
    var rawTransaction = {
        "from":targetAccount.address,
        "gasPrice":web3.utils.toHex(10000000000),
        "gasLimit":web3.utils.toHex(290000),
        "to":pancakeSwapRouterAddress,
        "value":web3.utils.toHex(amountToBuyWith),
        "data":data.encodeABI(),
        "nonce":web3.utils.toHex(count)
    };

    var transaction = new Tx(rawTransaction, {common: chain});
    transaction.sign(privateKey);
    let balance = await tokenContract.methods.balanceOf(targetAccount.address).call();
    console.log('was:', web3.utils.fromWei(balance, 'ether') );
    var result = await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));
    //console.log(result);
    // console.log(web3.utils.fromWei(web3.utils.hexToNumberString(result.logs[2].data), 'ether'));
    let balance2 = await tokenContract.methods.balanceOf(targetAccount.address).call();
    console.log('became', web3.utils.fromWei(balance, 'ether'));
    console.log('diff', balance2-balance);
    return result;
}