import { Common, PickerOptions } from './rad-imagepicker.common';
import * as frame from "tns-core-modules/ui/frame";
import * as imageSource from "tns-core-modules/image-source";

let imagePickerController;
declare var NSDocumentDirectory;
declare var NSUserDomainMask;

function createImageSourceFromUIImage(image, i) {
    const paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,
                                                        NSUserDomainMask, true);
    const documentsDirectory = paths.objectAtIndex(0)
    const documentsDirectoryNSString = NSString.stringWithString(documentsDirectory);
    const ms = new Date().getMilliseconds();
    const path = documentsDirectoryNSString.stringByAppendingPathComponent(`status${i}-${ms}.jpeg`);
    const data = UIImagePNGRepresentation(image);
    data.writeToFileAtomically(path, true);

    return imageSource.fromFile(path);
}

export class RadImagepicker extends Common {

    constructor() {
        super();
    }

    pick(options: PickerOptions): Promise<Array<any>> {
        return new Promise((resolve, reject) => {
            const viewController = frame.topmost().currentPage.ios;
        
            imagePickerController = ImagePickerController.new();

            const config = Configuration.new();

            if (options) {
                if (options.doneButtonTitle) {
                    config.doneButtonTitle = options.doneButtonTitle;
                }
                if (options.noImagesTitle) {
                    config.noImagesTitle = options.noImagesTitle;
                }
                if (options.allowVideoSelection !== undefined) {
                    config.allowVideoSelection = options.allowVideoSelection;
                }
                if (options.recordLocation !== undefined) {
                    config.recordLocation = options.recordLocation;
                }
            }

            imagePickerController.initWithConfiguration(config);
            if (options && options.imageLimit > 0) {
                imagePickerController.imageLimit = options.imageLimit;
            }

            imagePickerController.delegate = ImagePickerDelegateImpl.new().initWithCallback((selectedImages) => {
                imagePickerController = null;
                resolve(selectedImages);
            });
            viewController.presentViewControllerAnimatedCompletion(imagePickerController, true, null);
        });
    }
}

export class ImagePickerDelegateImpl extends NSObject implements ImagePickerDelegate {
    public static ObjCProtocols = [ImagePickerDelegate];
    static new(): ImagePickerDelegateImpl {
        return <ImagePickerDelegateImpl>super.new();
    }
    private _callback: (images?) => void;

    public initWithCallback(callback: (images?) => void): ImagePickerDelegateImpl {
        this._callback = callback;
        return this;
    }

    cancelButtonDidPress(imagePicker: ImagePickerController): void {
        this._callback();
        const viewController = frame.topmost().currentPage.ios;
        viewController.dismissViewControllerAnimatedCompletion(true, null);
    }    
    
    doneButtonDidPressImages(imagePicker: ImagePickerController, images: NSArray<UIImage>): void {
        let selectedImages = [];
        for (let i = 0; i < images.count; i++) {
            selectedImages.push(createImageSourceFromUIImage(images[i], i));
        }
        this._callback(selectedImages);
        const viewController = frame.topmost().currentPage.ios;
        viewController.dismissViewControllerAnimatedCompletion(true, null);
    }

    wrapperDidPressImages(imagePicker: ImagePickerController, images: NSArray<UIImage>): void {
        const viewController = frame.topmost().currentPage.ios;
        if (images.count < 1) {
            viewController.dismissViewControllerAnimatedCompletion(true, null);
        } else {
            let lightboxImages = [];
            
            for (let i = 0; i < images.count; i++) {
                const lb = new LightboxImage({
                    image: images[i],
                    text: null,
                    videoURL: null
                });
                lightboxImages.push(lb);
            }
            
            let lightbox = new (<any> LightboxController)({
                images: lightboxImages,
                startIndex: 0
            });
            
            imagePickerController.presentViewControllerAnimatedCompletion(lightbox, true, null);
        }
    }
}
