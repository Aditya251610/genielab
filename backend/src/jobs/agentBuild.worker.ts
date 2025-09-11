import { Worker } from "bullmq"

export const agentWorker = new Worker('agent-build-queue',
    async job => {
        console.log(job.id);
        console.log(job.data.manifest);
        console.log("Generating agent source code");
        console.log("Packagig files into a zip file");
        console.log("building docker image");
        console.log(`Job ${job.id} completed successfully`);
    },
    {
    connection: {
       host: "redis-17547.c321.us-east-1-2.ec2.redns.redis-cloud.com",
      port: 17547,
      username: "default", 
      password: "fiVF8RxUC1e4r1h9gUHCjTBs48nShkeP"
    }
  }
)