<?php

namespace App\InputModel;

use Symfony\Component\Validator\Constraints as Assert;

class StorageFileInputModel
{
    public function __construct(
        #[Assert\NotBlank(message: "The 'name' filed is required.")]
        #[Assert\Type(type: "string", message: "The 'name' field should be a string.")]
        public ?string $name = null,
        #[Assert\NotBlank(message: "The 'data' filed is required.")]
        #[Assert\Type(type: "string", message: "The 'data' field should be a string.")]
        public ?string $data = null)
    {
    }
}
