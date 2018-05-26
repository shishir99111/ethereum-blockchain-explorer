# Ethereum Blockchain Explorer

> Platform to explore and search the Ethereum blockchain for transactions, addresses, balance of your wallet.

> Technology: Nodejs, Express Server, Postgres DB, Etherscan API.

- Accept an Ethereum address as input, and then:
- query https://etherscan.io/apis and collects all transactions associated with that address.
- store the transactions in the DB.
- store the address balances in the DB.
- Return transactions of stored ETH address, and accept search params.
- Return stored address balances by ETH address, and other information about the address as well.