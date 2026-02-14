import { ethers, upgrades } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString());

  // Configuration
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  const feeRate = 300; // 3%

  // Deploy PredictionMarket
  console.log('\nDeploying PredictionMarket...');
  const PredictionMarket = await ethers.getContractFactory('PredictionMarket');
  const predictionMarket = await upgrades.deployProxy(PredictionMarket, [
    deployer.address,
    treasuryAddress,
    feeRate,
  ]);

  await predictionMarket.waitForDeployment();
  const predictionMarketAddress = await predictionMarket.getAddress();

  console.log('PredictionMarket deployed to:', predictionMarketAddress);
  console.log('Implementation address:', await upgrades.erc1967.getImplementationAddress(predictionMarketAddress));

  // Verification info
  console.log('\n========== Deployment Summary ==========');
  console.log('Network:', (await ethers.provider.getNetwork()).name);
  console.log('PredictionMarket (Proxy):', predictionMarketAddress);
  console.log('Admin:', deployer.address);
  console.log('Treasury:', treasuryAddress);
  console.log('Fee Rate:', feeRate / 100, '%');
  console.log('=========================================');

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    predictionMarket: predictionMarketAddress,
    implementation: await upgrades.erc1967.getImplementationAddress(predictionMarketAddress),
    admin: deployer.address,
    treasury: treasuryAddress,
    feeRate,
    deployedAt: new Date().toISOString(),
  };

  const fs = await import('fs');
  const path = await import('path');
  const deploymentsDir = path.join(__dirname, '../deployments');

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${deploymentInfo.network}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('\nDeployment info saved to deployments/' + deploymentInfo.network + '.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
