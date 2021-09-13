const assert = require('assert');

const LiskV3DEXAdapterModule = require('../index');
const Channel = require('./utils/channel');
const AppModuleMock = require('./utils/app');
const {wait} = require('../liskv3/utils');

// This test suite can be adapted to check whether or not a custom chain module is compatible with Lisk DEX.
// All the boilerplate can be modified except the 'it' blocks where the assertions are made.
// If a module passes all the test case cases in this file, then it is compatible with Lisk DEX.

describe('DEX API tests', async () => {
  let adapterModule;
  let options;

  before(async () => {
    adapterModule = new LiskV3DEXAdapterModule({
      config: { env: 'test'},
      logger: {
        info: () => {},
        // info: (...args) => console.info.apply(console, args),
        debug: () => {},
        // debug: (...args) => console.debug.apply(console, args),
        warn: (...args) => console.warn.apply(console, args),
        error: (...args) => console.error.apply(console, args)
      }
    });

    // this.channel = new Channel({
    //   modules: {
    //     app: new AppModuleMock()
    //   }
    // });
    //
    // await adapterModule.load(this.channel);
  });

  after(async () => {
    await adapterModule.unload();
  });

  describe('module state', () => {

    it('should expose an info property', () => {
      let moduleInfo = adapterModule.info;
      assert(moduleInfo.author);
      assert(moduleInfo.version);
      assert(moduleInfo.name);
    });

    it('should expose an alias property', () => {
      assert(adapterModule.alias);
    });

    it('should expose an events property', () => {
      let events = adapterModule.events;
      assert(events.includes('bootstrap'));
      assert(events.includes('chainChanges'));
    });

  });

  describe('module actions', async () => {

    let memberAccounts = [];
    let blockList = [];

    describe('getMultisigWalletMembers action', async () => {

      it('should return an array of member addresses', async () => {
        let walletMembers = await adapterModule.actions.getMultisigWalletMembers.handler({
          params: {
            walletAddress: 'lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4'
          }
        });
        const memberAddessList = ['lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4', 'lskmpnnwk2dcrywz6egczeducykso8ykyj9ppdsrh']

        // Must be an array of wallet address strings.
        assert.equal(JSON.stringify(walletMembers.sort()), JSON.stringify(memberAddessList.sort()));
      });

      it('should throw a MultisigAccountDidNotExistError if the multisig wallet address does not exist', async () => {
        let caughtError = null;
        try {
          await adapterModule.actions.getMultisigWalletMembers.handler({
            params: {
              walletAddress: 'ldpos6312b77c6ca4233141835eb37f8f33a45f18d50f'
            }
          });
        } catch (error) {
          caughtError = error;
        }
        assert.notEqual(caughtError, null);
        assert.equal(caughtError.type, 'InvalidActionError');
        assert.equal(caughtError.name, 'MultisigAccountDidNotExistError');
      });

    });

    describe('getMinMultisigRequiredSignatures action', async () => {

      it('should return the number of required signatures', async () => {
        let requiredSignatureCount = await adapterModule.actions.getMinMultisigRequiredSignatures.handler({
          params: {
            walletAddress: 'lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4'
          }
        });
        assert.equal(requiredSignatureCount, 2);
      });

      it('should throw an AccountDidNotExistError if the wallet address does not exist', async () => {
        let caughtError = null;
        try {
          await adapterModule.actions.getMinMultisigRequiredSignatures.handler({
            params: {
              walletAddress: 'ldpos6312b77c6ca4233141835eb37f8f33a45f18d50f'
            }
          });
        } catch (error) {
          caughtError = error;
        }
        assert.notEqual(caughtError, null);
        assert.equal(caughtError.type, 'InvalidActionError');
        assert.equal(caughtError.name, 'MultisigAccountDidNotExistError');
      });

      it('should throw an AccountWasNotMultisigError if the account is not a multisig wallet', async () => {
        let caughtError = null;
        try {
          await adapterModule.actions.getMinMultisigRequiredSignatures.handler({
            params: {
              walletAddress: 'lskx5t5nc997jczxn6s7ggoqtwcdbgs3u5r8q5b42'
            }
          });
        } catch (error) {
          caughtError = error;
        }
        assert.notEqual(caughtError, null);
        assert.equal(caughtError.type, 'InvalidActionError');
        assert.equal(caughtError.name, 'AccountWasNotMultisigError');
      });

    });

    describe('getOutboundTransactions action', async () => {

      const senderWalletAddress = 'lskhszrdpk5yzngd885cvsvsuxcko7trsvdpn2moz'

      it('should return an array of transactions sent from the specified walletAddress', async () => {
        let transactions = await adapterModule.actions.getOutboundTransactions.handler({
          params: {
            walletAddress: senderWalletAddress,
            fromTimestamp: 0,
            limit: 100
          }
        });
        assert(Array.isArray(transactions));
        assert.equal(transactions.length, 3);
        assert.equal(transactions[0].senderAddress, senderWalletAddress);
        assert.equal(transactions[0].message, '');
        assert.equal(transactions[1].senderAddress, senderWalletAddress);
        assert.equal(transactions[1].message, '');
        assert.equal(transactions[2].senderAddress, senderWalletAddress);
        assert.equal(transactions[2].message, '');

        for (let txn of transactions) {
          assert.equal(typeof txn.id, 'string');
          assert.equal(typeof txn.message, 'string');
          assert.equal(typeof txn.amount, 'string');
          assert.equal(Number.isNaN(Number(txn.amount)), false);
          assert.equal(Number.isInteger(txn.timestamp), true);
        }
      });

      it.skip('should return transactions which are more recent than fromTimestamp by default', async () => {
        let transactions = await adapterModule.actions.getOutboundTransactions.handler({
          params: {
            walletAddress: clientForger.walletAddress,
            fromTimestamp: 15000,
            limit: 100
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 3);
        assert.equal(transactions[0].senderAddress, clientForger.walletAddress);
        assert.equal(transactions[0].message, '1');
        assert.equal(transactions[1].senderAddress, clientForger.walletAddress);
        assert.equal(transactions[1].message, '2');
        assert.equal(transactions[2].senderAddress, clientForger.walletAddress);
        assert.equal(transactions[2].message, '3');
      });

      it.skip('should return transactions which are more recent than fromTimestamp when order is desc', async () => {
        let transactions = await adapterModule.actions.getOutboundTransactions.handler({
          params: {
            walletAddress: clientForger.walletAddress,
            fromTimestamp: 40000,
            limit: 100,
            order: 'desc'
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 3);
        assert.equal(transactions[0].senderAddress, clientForger.walletAddress);
        assert.equal(transactions[0].message, '2');
        assert.equal(transactions[1].senderAddress, clientForger.walletAddress);
        assert.equal(transactions[1].message, '1');
        assert.equal(transactions[2].senderAddress, clientForger.walletAddress);
        assert.equal(transactions[2].message, '0');
      });

      it('should limit the number of transactions based on the specified limit', async () => {
        let transactions = await adapterModule.actions.getOutboundTransactions.handler({
          params: {
            walletAddress: senderWalletAddress,
            fromTimestamp: 0,
            limit: 1
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 1);
        assert.equal(transactions[0].senderAddress, senderWalletAddress);
        assert.equal(transactions[0].message, '');
      });

      it('should return an empty array if no transactions can be matched', async () => {
        let transactions = await adapterModule.actions.getOutboundTransactions.handler({
          params: {
            walletAddress: senderWalletAddress,
            fromTimestamp: 3434323432,
            limit: 100
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 0);
      });

    });

    describe('getInboundTransactionsFromBlock action', async () => {

      it('should return an array of transactions sent to the specified walletAddress', async () => {
        let recipientAddress = 'ldpos5f0bc55450657f7fcb188e90122f7e4cee894199';
        let transactions = await adapterModule.actions.getInboundTransactionsFromBlock.handler({
          params: {
            walletAddress: recipientAddress,
            blockId: blockList[0].id
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 1);
        let txn = transactions[0];

        assert.equal(typeof txn.id, 'string');
        assert.equal(typeof txn.message, 'string');
        assert.equal(typeof txn.amount, 'string');
        assert.equal(Number.isNaN(Number(txn.amount)), false);
        assert.equal(Number.isInteger(txn.timestamp), true);
        assert.equal(typeof txn.senderAddress, 'string');
        assert.equal(typeof txn.recipientAddress, 'string');

        assert.equal(transactions[0].recipientAddress, recipientAddress);
        assert.equal(transactions[0].message, '1');
      });

      it('should return an empty array if no transactions match the specified blockId', async () => {
        let recipientAddress = 'ldpos5f0bc55450657f7fcb188e90122f7e4cee894199';
        let transactions = await adapterModule.actions.getInboundTransactionsFromBlock.handler({
          params: {
            walletAddress: recipientAddress,
            blockId: '31d9d53d4912be178c3bd5421a59b2a32f9560ca'
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 0);
      });

      it('should return an empty array if no transactions match the specified walletAddress', async () => {
        let recipientAddress = 'ldpos5f0bc55450657f7fcb188e90122f7e4cee894199';
        let transactions = await adapterModule.actions.getInboundTransactionsFromBlock.handler({
          params: {
            walletAddress: 'ldpos6312b77c6ca4233141835eb37f8f33a45f18d50f',
            blockId: blockList[0].id
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 0);
      });

    });

    describe('getOutboundTransactionsFromBlock action', async () => {

      it('should return an array of transactions sent to the specified walletAddress', async () => {
        let transactions = await adapterModule.actions.getOutboundTransactionsFromBlock.handler({
          params: {
            walletAddress: clientForger.walletAddress,
            blockId: blockList[0].id
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 2);

        for (let txn of transactions) {
          assert.equal(typeof txn.id, 'string');
          assert.equal(typeof txn.message, 'string');
          assert.equal(typeof txn.amount, 'string');
          assert.equal(Number.isNaN(Number(txn.amount)), false);
          assert.equal(Number.isInteger(txn.timestamp), true);
          assert.equal(typeof txn.senderAddress, 'string');
          assert.equal(typeof txn.recipientAddress, 'string');
        }

        assert.equal(transactions[0].senderAddress, clientForger.walletAddress);
        assert.equal(transactions[0].message, '0');
        assert.equal(transactions[1].senderAddress, clientForger.walletAddress);
        assert.equal(transactions[1].message, '1');
      });

      it('should return transactions with a valid signatures property if transaction is from a multisig wallet', async () => {
        let transactions = await adapterModule.actions.getOutboundTransactionsFromBlock.handler({
          params: {
            walletAddress: clientForger.walletAddress,
            blockId: blockList[2].id
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 1);
        let txn = transactions[0];

        assert.equal(typeof txn.id, 'string');
        assert.equal(typeof txn.message, 'string');
        assert.equal(typeof txn.amount, 'string');
        assert.equal(Number.isNaN(Number(txn.amount)), false);
        assert.equal(Number.isInteger(txn.timestamp), true);
        assert.equal(Array.isArray(txn.signatures), true);
        for (let signature of txn.signatures) {
          assert.notEqual(signature, null);
          assert.equal(typeof signature.signerAddress, 'string');
        }
        assert.equal(typeof txn.senderAddress, 'string');
        assert.equal(typeof txn.recipientAddress, 'string');
      });

      it('should return an empty array if no transactions match the specified blockId', async () => {
        let transactions = await adapterModule.actions.getOutboundTransactionsFromBlock.handler({
          params: {
            walletAddress: clientForger.walletAddress,
            blockId: '31d9d53d4912be178c3bd5421a59b2a32f9560ca'
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 0);
      });

      it('should return an empty array if no transactions match the specified walletAddress', async () => {
        let transactions = await adapterModule.actions.getOutboundTransactionsFromBlock.handler({
          params: {
            walletAddress: 'ldpos6312b77c6ca4233141835eb37f8f33a45f18d50f',
            blockId: blockList[0].id
          }
        });
        assert.equal(Array.isArray(transactions), true);
        assert.equal(transactions.length, 0);
      });

    });

    describe('getLastBlockAtTimestamp action', async () => {

      it('should return the highest block which is below the specified timestamp', async () => {
        let block = await adapterModule.actions.getLastBlockAtTimestamp.handler({
          params: {
            timestamp: 31000
          }
        });
        assert.notEqual(block, null);
        assert.equal(block.height, 1);
      });

      it('should throw a BlockDidNotExistError error if no block can be found before the specified timestamp', async () => {
        let caughtError = null;
        try {
          await adapterModule.actions.getLastBlockAtTimestamp.handler({
            params: {
              timestamp: 29000
            }
          });
        } catch (error) {
          caughtError = error;
        }
        assert.notEqual(caughtError, null);
        assert.equal(caughtError.type, 'InvalidActionError');
        assert.equal(caughtError.name, 'BlockDidNotExistError');
      });

    });

    describe('getMaxBlockHeight action', async () => {

      it('should return the height of the block as an integer number', async () => {
        let height = await adapterModule.actions.getMaxBlockHeight.handler();
        assert.equal(height, 3);
      });

    });

    describe('getBlocksBetweenHeights action', async () => {

      it('should return blocks whose height is greater than fromHeight and less than or equal to toHeight', async () => {
        let blocks = await adapterModule.actions.getBlocksBetweenHeights.handler({
          params: {
            fromHeight: 1,
            toHeight: 2,
            limit: 100
          }
        });
        assert.equal(Array.isArray(blocks), true);
        assert.equal(blocks.length, 1);
        let block = blocks[0];
        assert.equal(typeof block.id, 'string');
        assert.equal(Number.isInteger(block.timestamp), true);
        assert.equal(block.height, 2);
      });

      it('should return blocks whose height is greater than fromHeight and less than or equal to toHeight', async () => {
        let blocks = await adapterModule.actions.getBlocksBetweenHeights.handler({
          params: {
            fromHeight: 0,
            toHeight: 2,
            limit: 1
          }
        });
        assert.equal(Array.isArray(blocks), true);
        assert.equal(blocks.length, 1);
        assert.equal(blocks[0].height, 1);
      });

      it('should return an empty array if no blocks are matched', async () => {
        let blocks = await adapterModule.actions.getBlocksBetweenHeights.handler({
          params: {
            fromHeight: 9,
            toHeight: 10,
            limit: 10
          }
        });
        assert.equal(Array.isArray(blocks), true);
        assert.equal(blocks.length, 0);
      });

    });

    describe('getBlockAtHeight action', async () => {

      it('should expose a getBlockAtHeight action', async () => {
        let block = await adapterModule.actions.getBlockAtHeight.handler({
          params: {
            height: 2
          }
        });
        assert.notEqual(block, null);
        assert.equal(block.height, 2);
        assert.equal(Number.isInteger(block.timestamp), true);
      });

      it('should throw a BlockDidNotExistError if no block could be matched', async () => {
        let caughtError = null;
        try {
          await adapterModule.actions.getBlockAtHeight.handler({
            params: {
              height: 9
            }
          });
        } catch (error) {
          caughtError = error;
        }
        assert.notEqual(caughtError, null);
        assert.equal(caughtError.type, 'InvalidActionError');
        assert.equal(caughtError.name, 'BlockDidNotExistError');
      });

    });

    describe('postTransaction action', async () => {

      it('should accept a prepared (signed) transaction object as argument', async () => {
        // The format of the prepared (signed) transaction will be different depending on the
        // implementation of the chain module and the specified ChainCrypto adapter.
        // Since this is used for posting multisig transactions, the transaction will have
        // a 'signatures' property containing an array of signature objects created by the DEX.
        // The format of each signature object is flexible depending on the output of the ChainCrypto
        // adapter but it will have a 'signerAddress' property.
        // The chain module can handle the transaction and signature objects however it wants.
        let preparedTxn = await clientForger.prepareTransaction({
          type: 'transfer',
          recipientAddress: 'ldpos5f0bc55450657f7fcb188e90122f7e4cee894199',
          amount: '3300000000',
          fee: '100000000',
          timestamp: 100000,
          message: ''
        });
        await adapterModule.actions.postTransaction.handler({
          params: {
            transaction: preparedTxn
          }
        });
      });

    });

  });

  describe.skip('module events', async () => {

    it('should trigger bootstrap event after launch', async () => {
      await wait(200);
      // assert.equal(bootstrapEventTriggered, true);
    });

    it('should expose a chainChanges event', async () => {
      await wait(30000);
      // assert.equal(chainChangeEvents.length >=1, true);
      // let eventData = chainChangeEvents[0].data;
      // assert.equal(eventData.type, 'addBlock');
      // let { block } = eventData;
      // assert.notEqual(block, null);
      // assert.equal(block.height, 1);
      // assert.equal(Number.isInteger(block.timestamp), true);
    });

  });

});
