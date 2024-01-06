<?php

namespace App\Controller\Api;

use App\Form\StorageFileFormType;
use App\InputModel\StorageFileInputModel;
use App\Service\StorageFileService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/storage-file/{storageName<^[a-zA-Z0-9-_]{1,10}$>}', name: 'api_storage_')]
class StorageFileController extends AbstractController
{
    public function __construct(private readonly StorageFileService $storageFileService)
    {
    }

    #[Route('', name: 'get_all', methods: ['GET'])]
    public function getAll(string $storageName, Request $request): JsonResponse
    {
        return new JsonResponse([
            'apiUrl' => $request->getUri(),
            'files' => $this->storageFileService->list($storageName),
        ]);
    }

    #[Route('/{fileName<^[a-zA-Z0-9-_]+$>}', name: 'get', methods: ['GET'])]
    public function get(string $storageName, string $fileName): JsonResponse
    {
        return new JsonResponse([
            'file' => $this->storageFileService->read($storageName, $fileName),
        ]);
    }

    #[Route('', name: 'post', methods: ['POST'])]
    public function post(string $storageName, Request $request): JsonResponse
    {
        $form = $this->createForm(StorageFileFormType::class, new StorageFileInputModel());
        $data = json_decode($request->getContent(), true);
        $form->submit($data);

        if (!$form->isValid()) {
            $errors = [];

            foreach ($form->getErrors(true) as $error) {
                $errors[] = $error->getMessage();
            }

            return $this->json([
                'errors' => $errors
            ], Response::HTTP_NOT_ACCEPTABLE);
        }

        $this->storageFileService->save($storageName, $form->getData());

        return new JsonResponse(null);
    }
}
