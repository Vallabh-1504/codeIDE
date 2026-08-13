import path from 'path';

interface DockerCommandOptions {
    jobDir: string;
    memory?: string;
    cpus?: string;
    image?: string;
    containerCommand: string;
}

// Build secure Docker run command with resource limits and isolation flags.
export const buildDockerCommand = (options: DockerCommandOptions): string => {
    const { 
        jobDir, 
        memory = '256m', 
        cpus = '1.0', 
        image = 'codeStudio-image', 
        containerCommand 
    } = options;

    let mountPath = jobDir;

    // Support for Docker-in-Docker host path mapping
    if (process.env.HOST_TEMP_DIR) {
        const pathParts = jobDir.split(/[\\/]/);
        const jobId = pathParts[pathParts.length - 1];
        // Ensure path formatting uses standard slashes or host-specific joining
        mountPath = `${process.env.HOST_TEMP_DIR}/${jobId}`;
    }

    return `docker run --rm \\
        --init \\
        --network none \\
        --memory ${memory} \\
        --cpus ${cpus} \\
        --pids-limit 50 \\
        --ulimit fsize=10000000 \\
        -v "${mountPath}:/app" \\
        ${image} \\
        /bin/sh -c "${containerCommand}"`;
};
