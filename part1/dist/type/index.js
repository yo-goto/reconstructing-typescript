import * as Constructors from "./constructors.js";
import * as Validators from "./validators.js";
import IsSubtype from "./isSubtype.js";
import ToString from "./toString.js";
import OfTSType from "./ofTSType.js";
import PropType from "./propType.js";
var Type;

(function (Type2) {
  Type2.nullType = Constructors.nullType;
  Type2.boolean = Constructors.boolean;
  Type2.number = Constructors.number;
  Type2.string = Constructors.string;
  Type2.object = Constructors.object;
  Type2.isNull = Validators.isNull;
  Type2.isBoolean = Validators.isBoolean;
  Type2.isNumber = Validators.isNumber;
  Type2.isString = Validators.isString;
  Type2.isObject = Validators.isObject;
  Type2.isSubtype = IsSubtype;
  Type2.toString = ToString;
  Type2.ofTSType = OfTSType;
  Type2.propType = PropType;
})(Type || (Type = {}));

export default Type;