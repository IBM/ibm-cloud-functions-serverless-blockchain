# **Use Cloud Functions to Send Your Data to Your Blockchain**

This tutorial will show you how to use IBM Cloud Functions to connect your devices and applications to your blockchain. We\'ll provide code for two cloud functions and step-by-step instructions to deploy and test those cloud functions, allowing you to store your blockchain credentials in your Cloudant database and use those credentials to securely send transactions to your blockchain.  
 

**Learning objectives**

This tutorial guides you through the steps to build and test cloud functions that provide connectivity to your blockchain.  

When you finish this tutorial, you will have: 

-   A set of IBM Cloud Functions that act as an IBM Blockchain Platform client 

-   A test environment to send transactions securely to your IBM Blockchain Platform instance 

**Prerequisites**

In this tutorial, you will need an IBM Cloud account, an IBM Blockchain Platform instance, Docker and Node.js installed on your local machine, and a test utility such as curl, Postman or Node-RED to make REST calls.  This tutorial will show you how to use Postman for testing.  

Before you start, you need to prepare the following products to complete this tutorial: 

-   [IBM Cloud Kubernetes Cluster](https://cloud.ibm.com/kubernetes/catalog/cluster) 

-   [IBM Blockchain Platform](https://cloud.ibm.com/catalog/services/blockchain-platform) - Follow the [instructions](https://cloud.ibm.com/docs/services/blockchain/howto?topic=blockchain-ibp-console-build-network) to build a blockchain network. 

-   [Cloudant](https://cloud.ibm.com/catalog/services/cloudant) - Note the \"url\" from the Cloudant service credentials. Do not create a database. 

-   [Docker](https://docs.docker.com/install/) 

-   [Node.js](https://nodejs.org/en/download/) 

-   [Postman](https://www.getpostman.com/downloads/) 

Note: You may opt for a free 30-day Kubernetes cluster and a free 30-day IBM Blockchain Platform instance when deploying IBM Blockchain Platform to a free Kubernetes cluster.  The free Kubernetes cluster is deleted automatically after 30 days. 

Why are Docker and Node.js needed?  You will need these tools to build the cloud functions, including creating the correct node\_modules directory for the cloud function runtime environment, before you upload them to your IBM Cloud account. 

**Estimated time** 

After the prerequisites are installed, it should take you about 30 minutes to complete this tutorial. 

**Steps**

1.  **Clone the repository**  
    `$git clone https://github.com/IBM/ibm-cloud-functions-serverless-blockchain.git` 

2.  **Install the IBM Cloud CLI**  
    Follow the [installation instructions](https://cloud.ibm.com/docs/cli?topic=cloud-cli-getting-started) to install the IBM Cloud command-line tool. Make sure you run the test action  
    `$ibmcloud wsk action invoke /whisk.system/utils/echo -p message hello --result\`  
    so that your  ~/.wskprops  is pointing to the right account. 

3.  **Deploy the provided cloud functions**  

    ***Deploy the send-to-blockchain cloud function to your IBM Cloud account***   
    a. Add your cloudant URL to line 8 of send-to-blockchain.js and save the file:  
    const dbUrl = "\<add-your-cloudant-url-here\>"  
    
    b. Log into IBM cloud and change to your local directory that contains the source code for the cloud function.  
    
    c. Generate the node\_modules directory with the correct OS for the machine the cloud function will run on by running this command without changes:  `$ docker run -it -v \$PWD:/nodejsAction openwhisk/action-nodejs-v8 /bin/bash`  Once inside the container, run `npm i` then `exit`.  
    
    d. Zip up the source code and generated node\_modules directory for the action:  `$ zip -r action.zip *`  
    
    e. Create the action in your IBM Cloud account:  
`$ ibmcloud wsk action create send-to-blockchain \--kind nodejs:8 action.zip`

    ***Deploy the store-credentials-cloudant cloud function to your IBM Cloud account***  
    a. Add your cloudant URL to line 7 of store-credentials-cloudant.js and save the file:  
    const dbUrl = "\<add-your-cloudant-url-here\>"  
    
    b. Log into IBM cloud and change to your local directory that contains the source code for the cloud function.  
    
    c. Generate the node_modules directory with the correct OS for the machine the cloud function will run on by running this command without changes:   
    `$ docker run -it -v \$PWD:/nodejsAction openwhisk/action-nodejs-v8 /bin/bash`  
    Once inside the container, run `npm i` then `exit`.  
    
    d. Zip up the source code and generated node_modules directory for the action:  
    `$ zip -r action.zip *`  
    
    e. Create the action in your IBM Cloud account:   
    `$ ibmcloud wsk action create store-credentials-cloudant \--kind nodejs:8 action.zip`


4.  **Obtain the API key and URLs for your cloud functions**  

    a. From the IBM Cloud menu, select "Functions".  
    
    b. In the next menu, click on "Actions", then click on the "send-to-blockchain" action.  
    
    c. In the next menu, click on "Endpoints", then click on "API-KEY" on the resulting panel.  
    
    d. In the section "CF-based API key for this namespace" click the eye icon to view your API key and copy the API key.  
    
    e. Save this value, which you'll need to configure your Postman REST calls to your cloud functions.
    
    f. In the same section, copy the URL and save this value.  
    
    g. From the IBM Cloud Function menu, select "Actions" and click on the "store-credentials-cloudant" action.  
    
    h. In the next menu, click on "Endpoints".  
    
    i. In the section "CF-based API key for this namespace" , copy the URL and save this value, which you'll need to configure your Postman REST calls to your cloud functions in an upcoming step. 

5.  **Install the provided blockchain smart contract**  
    Follow the [instructions](https://cloud.ibm.com/docs/services/blockchain/howto?topic=blockchain-ibp-console-smart-contracts#ibp-console-smart-contracts-install) to install and instantiate the provided iot-shipping-contract.cds smart contract on your peer in your IBM Blockchain Platform instance.  TODO: provide location in cloned repo from step 1  

6.  **Download blockchain credentials and connection profile**  
    
    a. Follow the [instructions](https://cloud.ibm.com/docs/services/blockchain/howto?topic=blockchain-ibp-console-app#ibp-console-app-profile) to download the connection profile for your contract.  
    
    b. In your IBM Blockchain Platform UI, click on "Wallet" and select the user you will use to connect to your blockchain, then click "Export".  
    
    Hint:  If you created your IBM Blockchain Platform instance just for this tutorial, use your 'admin' or 'Org1 admin' credentials.  

7.  **Install and configure the provided Postman collection**  

    ***Import the collection***  
    In the Postman UI, click the "Import" button to import the provided BlockchainCloudFunctions.postman_collection.json Postman collection.  
    
    TODO: provide location in cloned repo from step 1  
    
    ***Import the environment***  
    In the Postman UI, click the environment settings gear to "Manage Environments", then click the "Import" button to import the provided cloud-functions.postman_environment.json Postman environment.  
    
    ***Configure the environment***  
    a. Click on the imported "cloud-functions" environment to see the defined Postman environment variables.  
    
    b. Open the blockchain connection profile that you downloaded, copy the entire contents and paste those contents into the the Postman environment "connectonJson" value.  
    
    c. Open the credential file that you downloaded and copy the value of "private_key" into the Postman environment "privateKey" value.  
    
    d. From the same credential file, copy the value of "cert" into the Postman environment "userCert" value.  
    
    Note: Record the value of the "name" field from the credential file, as you will need it in an upcoming step.   

8.  **Store your blockchain credentials in Cloudant**  

    ***Set the REST Call Authorization***  
    a. Click on the "Blockchain Cloud Functions" Postman collection you imported.  
    b. Click on the "Create or update credentials" REST call.  
    c. Select the "Authorization" tab.  
    d. Select "Basic Auth" and provide the info from your Cloud Functions API key.  The API key consists of user:password.  Copy the portion before the ':' to the "Username" field and the portion after the ':' to the "Password" field.  
    
    ***Set the URL to your cloud function URL***  
    Update the URL field of the "Create or update credentials" REST call with the URL for the store-credentials-cloudant action, obtained in a previous step.  
    
    ***Set your request parameters***  
    Click on the request "Body" tab and edit the JSON:  
    ```  
    {  
      "id": "admin-myFabric",  
      "contract": "iot-shipping-contract",  
      "username": "admin",  
      "cert": {{userCert}},  
      "key": {{privateKey}},  
      "connection": {{connectionJson}}
    }  
    ```  
    
    - Supply any value for "id".  This will be the value you send with each transaction.  
    - For "username", supply the name of the user you noted from the credential file in a previous step.  If your display name does not match your user's name, e.g. if your display name in your blockchain platform for your user is "Org1 admin" but you used the "admin" user credentials for that user, supply "admin" for "username" in the request body.  

    ***Send the request***  
    Save your changes and click "Send" to store your credentials in your Cloudant database.  You will use these credentials to send each transaction to your blockchain.  
    

9.  **Send a transaction to your blockchain**  

    ***Set the REST Call Authorization***  
    a. In the "Blockchain Cloud Functions" Postman collection you imported, click on the "Send transaction" REST call.  
    b. Select the "Authorization" tab.  
    c. Select "Basic Auth" and provide the info from your Cloud Functions API key as in the previous step.  

    ***Set the URL to your cloud function URL***  
    Update the URL field of the "Send transaction" REST call with the URL for the send-to-blockchain action, obtained in a previous step.  

    ***Set your request parameters***  
    Click on the request "Body" tab and edit the JSON:  

    ```
    { 
      "id": "admin-myFabric",
      "fcn": "createShipment",
      "args": [ "1000", "Shipment of widgets",
        "30.2672", "97.7431", "103", ".35" ]  
    }
    ```
    Supply the value for "id" that you used in the previous step. This specifies the credentials you will use to send transactions to your blockchain.  

    ***Send the request***  
    Save your changes and click "Send" to send your transaction to your blockchain.  The first value in "args" is the shipment ID.  Change the shipment ID each time you submit a transaction.  Other fields are (in order): description, latitude, longitude, temperature and humidity.  

10. **Look for a new block in your blockchain**  

    a. In your IBM Blockchain Platform UI, click on "Channels".  
    b. Click on the channel you created when setting up your blockchain network.  
    c. Scroll down to "Block History" and click on the most recent block.  
    d. In the resulting transaction list for that block, click on the most recent transaction to see the transaction you just sent. 



**Summary**  

Congratulations! You should now be able to call your cloud functions to store blockchain credentials in your Cloudant database and then use those credentials to send transactions securely to your blockchain.  
