# CWMS Data Quality
_A JavaScript Library for determining Corps Water Management System (CMWS) Timeseries Quality client-side_

## Working Example of CWMS-Data-Quality JS Module
Here: [Github Page](https://krowvin.github.io/CWMS-Data-Quality/)
## Getting Started ☑ 
1. Install the CWMS-Data-Quality Package
   1. Using [**NPM**](https://www.npmjs.com/package/cwms-data-quality) (with nodejs installed):  
        1. In your terminal run:  
        `npm i cwms-data-quality`  
        2. In your typescript/javascript module (assuming you are using a bundler) you can enter:  
            1. `import {Quality, QualityStringRenderer} from "cwms-data-quality";` at the top of the file  
            2. Then down in your source you can, for example, call the QualityStringRender static method getJSON with:  
                `const determined = QualityStringRenderer.getJSON(quality_integer)`  
                 *where quality_integer is the variable you set.*
   2. **Manually**:  
        1. Download the the source code [here](https://github.com/krowvin/CWMS-Data-Quality/blob/master/) and place it in a directory called "cwms-data-quality". 
        cwms-data-quality.js. 
        2. Import/include the JS Module in your HTML file:  
          ```<script src="<path to your cdq  directory>/cwms-data-quality/index.min.js" type="module" async defer></script>```  
          (_optionally_): Start with the [example/default.html](https://github.com/krowvin/CWMS-Data-Quality/blob/master/example/index.html) file


## Per the HEC Documentation:

### Data Quality Rules :

    1. Unless the Screened bit is set, no other bits can be set.
       
    2. Unused bits (22, 24, 27-31, 32+) must be reset (zero).       

    3. The Okay, Missing, Questioned and Rejected bits are mutually 
       exclusive.

    4. No replacement cause or replacement method bits can be set unless
       the changed (different) bit is also set, and if the changed (different)
       bit is set, one of the cause bits and one of the replacement
       method bits must be set.

    5. Replacement Cause integer is in range 0..4.

    6. Replacement Method integer is in range 0..4

    7. The Test Failed bits are not mutually exclusive (multiple tests can be
       marked as failed).


### Bit Mappings :       
    Little Endian i.e. 31....0

         3                   2                   1                     
     2 1 0 9 8 7 6 5 4 3 2 1 0 9 8 7 6 5 4 3 2 1 0 9 8 7 6 5 4 3 2 1  
  
     P - - - - - T T T T T T T T T T T M M M M C C C D R R V V V V S  
     |           <---------+---------> <--+--> <-+-> | <+> <--+--> |  
     |                     |              |      |   |  |     |    +------Screened T/F  
     |                     |              |      |   |  |     +-----------Validity Flags  
     |                     |              |      |   |  +--------------Value Range Integer  
     |                     |              |      |   +-------------------Different T/F  
     |                     |              |      +---------------Replacement Cause Integer  
     |                     |              +---------------------Replacement Method Integer  
     |                     +-------------------------------------------Test Failed Flags  
     +-------------------------------------------------------------------Protected T/F  


### If you see any issues please report them! [⚠ Report Issues ⚠](https://github.com/krowvin/CWMS-Data-Quality/issues)  

  

### Dev Notes:  
  **NOTE**: _Ensure you have NodeJS installed and in your system path_
1. Run the test script, which compares the module against the precomputed CSV file in `resources`:  
    `npm run test`
2. Run the build script, which minifies the js file with:  
    `npm run build`  
3. Package the script for release:
   1. NPM:  
      `npm publish`
   2. Github:
      `npm pack`