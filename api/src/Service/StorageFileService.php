<?php

namespace App\Service;

use App\InputModel\StorageFileInputModel;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;

readonly class StorageFileService
{
    public function __construct(
        private Filesystem $filesystem,
        private Finder $finder,
        #[Autowire('%kernel.project_dir%/var/uploads/storage')]
        private string $storageDir
    ){
    }

    public function list(string $storageName): array
    {
        // TODO: validate storageName
        $files = [];
        $directoryPath = sprintf(
            '%s/%s/',
            $this->storageDir,
            $storageName
        );

        if ($this->filesystem->exists($directoryPath)) {
            foreach ($this->finder->in($directoryPath) as $file) {
                $files[] = $file->getBasename();
            }
        }

        return $files;
    }

    public function read(string $storageName, string $fileName): string
    {
        // TODO: check file is exists
        return file_get_contents(
            sprintf(
                '%s/%s/%s',
                $this->storageDir,
                $storageName,
                $fileName
            )
        );
    }

    public function save(string $storageName, StorageFileInputModel $fileInputModel): void
    {
        // TODO: maybe validate storageName and name?
        $this->filesystem->dumpFile(
            sprintf(
                '%s/%s/%s',
                $this->storageDir,
                $storageName,
                $fileInputModel->name
            ),
            $fileInputModel->data
        );
    }
}
