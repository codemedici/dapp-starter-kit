import {tokens, EVM_REVERT} from '../helpers/helpers.js'

const Token = artifacts.require('./Token')

require('chai')
	.use(require('chai-as-promised'))
	.should()

contract('Token', ([deployer, receiver, exchange]) => {
	const name = 'DApp Token'
	const symbol = 'DAPP'
	const totalSupply = tokens(1000000).toString()
	const decimals = '18'
	let token

	beforeEach(async () => {
		token = await Token.new()
	})

	describe('deployment', () => {
		it('tracks the name', async ()=>{
			// the token name should be My Name
			const result = await token.name()
			result.should.equal(name)
		})

		it('tracks the symbol', async ()=>{
			const result = await token.symbol()
			result.should.equal(symbol)
		})

		it('tracks the decimals', async ()=>{
			const result = await token.decimals()
			result.toString().should.equal(decimals)
		})

		it('tracks the total supply', async ()=>{
			const result = await token.totalSupply()
			result.toString().should.equal(totalSupply.toString())
		})

		it('assigns to total supply to the deployer', async ()=>{
			const result = await token.balanceOf(deployer)
			result.toString().should.equal(totalSupply.toString())
		})
	})

	describe('sending tokens', () => {
		let amount
		let result

		describe('success', async () => {
			beforeEach(async () => {
				amount = tokens(100).toString()
				result = await token.transfer(receiver, amount, {from: deployer})
			})

			it('transfers token balances', async () => {
				let balanceOf
				balanceOf = await token.balanceOf(deployer)
				balanceOf.toString().should.equal(tokens(999900).toString())
				balanceOf = await token.balanceOf(receiver)
				balanceOf.toString().should.equal(tokens(100).toString())
				
			})

			it('emits transfer event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Transfer')
				
				const event = log.args
				event.from.should.eq(deployer, 'deployer value is correct')
				event.to.should.eq(receiver, 'receiver address is correct')
				event.value.toString().should.eq(amount, 'amount is correct')
			})

		})

		describe('failure', async () => {

			it('rejects insufficient balances', async () => {
				let invalidAmount
				invalidAmount = tokens(100000000) // bigger than actual totalSupply
				// the message 'VM Exception...' is the one printed if require() returns false in Transfer(), i.e. if the below string matches the error message the test passes
				await token.transfer(receiver, invalidAmount, {from: deployer}).should.be.rejectedWith(EVM_REVERT)

				invalidAmount = tokens(10) // reveiver has no tokens
				await token.transfer(deployer, invalidAmount, {from: receiver}).should.be.rejectedWith(EVM_REVERT)
			})

			it('rejects invalid recepient', async () => {
				await token.approve(0x0, amount, {from: deployer}).should.be.rejected
			})
		})
	})
})
