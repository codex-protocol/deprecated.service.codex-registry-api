#!/bin/sh

# this makes sure nvm (and thus global npm packages) are in the path
source /home/ec2-user/.bash_profile

# set the NODE_ENV environment variable based on the CodeDeploy deployment group name
#
# NOTE: this is probably redundant since the source line above will load the
#  NODE_ENV exported from the .bashrc, but it's just a safegaurd to make sure
#  the app runs in the correct environment
if [[ $DEPLOYMENT_GROUP_NAME == "production" ]]
then
    NODE_ENV=production
elif [[ $DEPLOYMENT_GROUP_NAME == "staging" ]]
then
    NODE_ENV=staging
else
    NODE_ENV=development
fi

# tell pm2 to reload the application(s)
NODE_ENV=$NODE_ENV pm2 reload /opt/process/deployment/pm2/processes.yml
